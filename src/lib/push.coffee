###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

path = require 'path'
fs = require 'fs'

main_dir = path.join(path.dirname(fs.realpathSync(__filename)),'../')
lib_dir = main_dir + "lib/"

helper = require lib_dir + 'helper'
couch_helper = require lib_dir + 'couch_helper'
file_helper = require lib_dir + 'file_helper'

base64 = require  main_dir + 'vendor/base64'

connector= require lib_dir + 'connector'

helpers = require 'drtoms-nodehelpers'
println = helpers.printer.println
argparser = helpers.argparser
recursiveFileWalker = helpers.filehelper.recursiveFileWalker

mimetypes = (require lib_dir + "mimetypes").mimetypes

helpers = require 'drtoms-nodehelpers'
logging = helpers.logging
logger = logging.logger 'couchdev-push'

############################
# run
############################

exports.run = (argv) ->

  connection = connector.create()
  options = connector.get_options(connection)

  sourcedir = process.cwd()

  count_pushed_design_docs = 0
  count_pushed_data_docs= 0
  
  push_designdocs = true
  push_datadocs = false

  options.push {
    short: 'd'
    , long: 'sourcedir'
    , description: 'source directory, default: "'+sourcedir+'"'
    , value: true
    , callback: (value) -> sourcedir = fs.realpathSync(value)
    }


  options.push { long: 'skip-design-docs'
    , description: 'do not push any of the design documents'
    , value: false
    , callback: (value) -> push_designdocs = false
    }

  options.push { long: 'include-data-docs'
    , description: 'push data docs'
    , value: false
    , callback: (value) -> push_datadocs = true
    }

  argparser.parse
    help:true
    options:options
    argv:argv


  logger.debug "connection.url: ", connection.url()
  logger.trace "connection: ", connection


  # pushes contents of i.e. path.json and path/ to the document with the name path
  readDocument= (path, cont) ->

    doc =
      { couchdev:
        { pushed_at: (new Date()).toISOString()
        , manifest:[]
        }
      }

    tasktracker =  helpers.asynchelper.createTaskTracker ((err) -> cont(err,doc))
    outerTaskDone = tasktracker.createTask "read " + path
    integrateJsonDone = tasktracker.createTask "read" + path + "/_doc.json"

    file_helper.readDocument path + "/_doc.json", (err,data)->
      if err? then integrateJsonDone {"task":"integrate json failed", "err":err}
      else
        helper.recursiveMerge doc, data
        integrateJsonDone()


    # START fileHandler
    # the fileHandler integrates filecontents into the document structure
    fileHandler = (fullfilename,stat,fileDone)->
      logger.debug "filehandler #{fullfilename}"

      filename = (fullfilename.match /[^\/]+$/)[0]
      relativePath = fullfilename.replace path,""
      relativePath_dissected = relativePath.match (/(.*)(\.)([^\.]+$)/)
      relativeObjPath = if relativePath_dissected? then relativePath_dissected[1] else relativePath
      filename_dissected = filename.match (/(.*)(\.)([^\.]+$)/)
      filename_prefix = if filename_dissected? then filename_dissected[1] else filename
      filename_endig = if filename_dissected? then filename_dissected[3] else ""

      logger.trace "filename: ", filename
      logger.trace "relativePath: ",relativePath 
      logger.trace "relativePath_dissected: ",relativePath_dissected

      if not stat.isFile() then fileDone() # only read files (not directories e.g.)
      else if filename.match /^\./ then fileDone() # don't read anything starting with a dot
      else if relativePath.match /^\/_doc.json/ then fileDone() # don't read  /_doc.json   
      else
        logger.debug "integrating #{fullfilename}"

        rootObj = {}
        obj = rootObj

        fs.readFile fullfilename,'utf8',(err,data)->
          if err? then fileDone {"read file faile":"fullfilename","err":err}
          else
            if relativePath.match /^\/_attachments/
              obj["_attachments"]={}
              obj = obj["_attachments"]
              attachmentname = (relativePath.match /(^\/_attachments\/)(.*)/)[2]
              obj[attachmentname] = {}
              obj = obj[attachmentname]
              obj['data']=base64.encode data
              obj['content_type'] = mimetypes[filename_endig]
            else
              objpath = ((relativeObjPath.split '/').slice 1)
              doc.couchdev.manifest.push  (relativePath.replace /^\//,"")
              objpathLast = objpath.pop()
              for i in objpath
                obj[i] = {}
                obj = obj[i]

              obj[objpathLast] =
                if filename_endig is "json"
                  try
                    JSON.parse data
                  catch error
                    data
                else
                  data

            helper.recursiveMerge doc, rootObj
           
            fileDone()
    # END fileHandler


    walkFilesDone = tasktracker.createTask path

    recursiveFileWalker path,fileHandler,(err) ->
      walkFilesDone(err)

    outerTaskDone()

  putDoc = (docid, doc, cont) ->
    couch_helper.put_doc connection,docid,doc,(err)->
      if err? then cont ["putDoc failed",{"err":err}]
      else cont()
  
  start = (cont) ->

    logger.debug "SOURCEDIR: ", sourcedir

    filetracker =  helpers.asynchelper.createTaskTracker ((err) -> cont(err))
    outerDone = filetracker.createTask("outer")

    push_dir = (dir) ->
      logger.debug "push_dir:", dir
      fulldir = sourcedir+"/"+dir
      logger.debug "fulldir: ", fulldir 
      readdir_done = filetracker.createTask(dir)
      fs.readdir fulldir, (err,files) ->
        if err? then logger.warn "failed to read '#{dir}'"
        else files.forEach (filename) ->
          unless filename.match /^_/ # files beginning with underscore are reserved for internal couchdev and couchdb usage
            fullpath = fulldir+"/"+filename
            filedone = filetracker.createTask fullpath
            fs.stat fullpath, (err,stat)->
              if err? then filedone(err)
              else
                if stat.isDirectory()
                  docname = dir + "/" + (fullpath.match /\/([^\/]*)$/)[1]
                  logger.debug "docname: ",docname
                  readDocument fullpath , (err,doc)->
                    if err? then filedone({"readDocument":"failed for "+fullpath,"err":err})
                    else putDoc docname,doc, (err)->
                      if not err?
                        if (docname.match /^[\/]*_design/) then  count_pushed_design_docs += 1
                        else count_pushed_data_docs += 1
                      filedone(err)
                else filedone()
        readdir_done()

    push_dir "" if push_datadocs
    push_dir "/_design" if push_designdocs

    outerDone()

  start (err) ->
    if err?
      logger.error "couchdev push failed with ", err
    else
      logger.info "push done"
      println "couchdev pushed #{count_pushed_design_docs} design, and #{count_pushed_data_docs} data document(s)"



