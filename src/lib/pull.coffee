###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

path = require 'path'
fs = require 'fs'

main_dir = path.join(path.dirname(fs.realpathSync(__filename)),'../')
lib_dir = main_dir + "lib/"

couch_helper = require lib_dir + 'couch_helper'
file_helper = require lib_dir + 'file_helper'
helper = require lib_dir + 'helper'

base64 = require '../vendor/base64'
child_process = require 'child_process'
_ = require 'underscore'

connector = require lib_dir + 'connector'

helpers = require 'drtoms-nodehelpers'
println = helpers.printer.println
argparser = helpers.argparser

mkdeepdir = file_helper.mkdeepdir

jsonprettify = require 'jsonprettify'

util = require 'util'
inspect = () -> (util.inspect.apply this,arguments).replace /\n/g,""


helpers = require 'drtoms-nodehelpers'
logging = helpers.logging

logger = logging.logger 'couchdev-pull'


# BEGIN writeDesignDoc
writeDesignDoc = (args,cont) ->
  doc = args.doc

  writeDesignTracker =  helpers.asynchelper.createTaskTracker ((err) -> cont(err)), {name:("writeDesignTracker-" + doc._id)}
  writeDesignOuterDone = writeDesignTracker.createTask "writeDesignOuterDone"

  docpath = args.dir + "/" + doc._id

  # write attachments:
  writeAttachment = (targetdir,filepath,attachment, cont) ->
    [total,attachmentPath,filename] = (docpath+"/_attachments/"+filepath).match /(.*\/)(.*)/
    file_helper.mkdeepdir attachmentPath, (err) ->
      if err? then cont(err)
      else fs.writeFile docpath + "/_attachments/" + filepath, base64.decode(attachment.data),  (err) ->
        cont(err)

  for filepath, attachment of doc._attachments
    attachmentDone = writeDesignTracker.createTask filepath+attachment
    writeAttachment args.dir,filepath, attachment, attachmentDone

  delete doc._attachments


  # write object
  writeObject = (params,cont) ->
    file_helper.mkdeepdir docpath + "/" + params.path, (err) ->
      if err? then cont(err)
      else
        object = params.parent[params.object_name]
        delete params.parent[params.object_name]
        logger.debug "writing: " + docpath + "/" + params.file
        stringified =
          if not object?
            logger.warn "the to be stringyfied object is undefined for " + docpath + "/" + params.file
            ""
          else if typeof object is 'string'
            object
          else
            try
              jsonprettify.json2prettyjson JSON.stringify object
            catch error
              logger.warn "jsonprettify failed", error
              JSON.stringify object
        if not stringified?
          logger.error "stringified still not set"
          stringified = ""
        fs.writeFile docpath + "/" + params.file,stringified, (err) ->
          if err?
            logger.error "writing " + params.file + " failed",err
          cont(err)


  writeManifestFiles = (cont) ->

    manifestTaskTracker = helpers.asynchelper.createTaskTracker ((err) -> cont(err)), {name:"manifestTaskTracker"}
    mainManifestTaskDone = manifestTaskTracker.createTask "main task"

    # save couchdev-manifest files
    doc.couchdev = {} if not doc.couchdev?
    doc.couchdev.manifest = [] if not doc.couchdev.manifest?
    if doc.couchdev? && doc.couchdev.manifest? then (()->
      couchdevDone = manifestTaskTracker.createTask "couchdev manifest"
      manifest = doc.couchdev.manifest
      manifest = manifest.concat args.conf_manifest
      delete doc.couchdev
      manifest.forEach (file) ->

        dissected  = file.match /(.*)(\.)([^.]+)$/
        if dissected?
          objpath = dissected[1].split '/'
        else
          objpath = file.split '/'

        objname = objpath.pop()
        parent = doc
        for o in objpath
          parent=parent[o]
        writeObject(
          { path : (objpath.join("/") + "/")
          , parent: parent
          , object_name: objname
          , file: file
          }
          , manifestTaskTracker.createTask(file)
        )
      couchdevDone()
    )()
      
   
    # save stuff in couchapp-manifest as files
    if doc.couchapp? && doc.couchapp.manifest? then (()->
      couchappDone= manifestTaskTracker.createTask "couchapp manifest"
      manifest = doc.couchapp.manifest
      delete doc.couchapp.manifest
      manifest.forEach (file) ->
        if not file.match /^.*\/$/ # ignore directories

          path = ""
          object_name = ""
          filename = ""

          if file.match /\// # has path part
            path_matcher = ///^ 
                (.*/)      # -> path incl last /
                ([^/]+)   # at least one of anything but '/' -> object
              $///
            [whatever,path,filename] = file.match path_matcher
          else
            filename = file

          if filename.match /\./ # has ending
            obj_matcher = ///^
                (.*)       #  obj
                \.
                ([^\.]+) # ending incl 
              $///
            [whatever,object_name] = filename.match obj_matcher
          else
            object_name = filename

          parent = helper.lastObjPath doc, path

          writeObject(
            { path:path
            , parent:parent
            , object_name:object_name
            , file:file
            }
            , manifestTaskTracker.createTask(path + "/" + file)
            )
      couchappDone()
    )()

    mainManifestTaskDone()
  #END writeManifestFiles


  #BEGIN writeViewsAndShows
  writeViewsAndShows = (cont) ->
    writeViewsAndShowsTaskTracker =  helpers.asynchelper.createTaskTracker ((err) -> cont(err)),{name:"writeViewsAndShowsTaskTracker"}
    outerDone = writeViewsAndShowsTaskTracker.createTask()

    views = doc.views
    if views?
      for viewName, viewValue of views
        for fun,funValue of views[viewName]
          writeObject(
              {"path": "views/" + viewName + "/"
              ,"parent": views[viewName]
              ,"object_name": fun
              ,"file": "views/" + viewName + "/" + fun + ".js"
              }
              ,writeViewsAndShowsTaskTracker.createTask()
            )

    shows = doc.shows
    if shows?
      for own fun,funValue of shows
        writeObject(
            {"path": "shows/"
            ,"parent": shows
            ,"object_name": fun
            ,"file": "shows/" + fun + ".js"
            }
            ,writeViewsAndShowsTaskTracker.createTask()
          )

    outerDone()
  #END writeViewsAndShows

  writeFilesDone = writeDesignTracker.createTask "writeFilesDone"
  writeManifestFiles (err) ->
    if err? then writeFilesDone(err)
    else
      writeViewsAndShows (err) ->
        if err? then writeFilesDone(err)
        else

        # write reminder into .json
        delete doc._rev
        delete doc._id

        helper.recursiveDeleteEmptyObjects(doc)
        logger.info "WRITING: ",docpath+".json"

        file_helper.mkdeepdir docpath, (err) ->
          if err? then writeFilesDone(err)
          else fs.writeFile docpath+"/_doc.json",(jsonprettify.json2prettyjson (JSON.stringify doc)), (err) ->
            if err?
              logger.error "wrting "+docpath+".json failed",err
            writeFilesDone(err)

  writeDesignOuterDone()
# END writeDesignDoc


############################
# run
############################
exports.run = (argv) ->


  # set-up
  connection = connector.create()
  options = connector.get_options(connection)
  targetdir = "./my_couch_data"
  pull_designdocs = true
  pull_datadocs = false
  conf_manifest = []
 

  options.push {
    short: 'd'
    , long: 'targetdir'
    , description: 'target directory, default: "'+targetdir+'"'
    , value: true
    , callback: (value) -> targetdir = value
    }

  options.push { long: 'skip-design-docs'
    , description: 'do not pull any of the design documents'
    , value: false
    , callback: (value) -> pull_designdocs = false
    }

  options.push { long: 'include-data-docs'
    , description: 'pull data docs'
    , value: false
    , callback: (value) -> pull_datadocs = true
    }

  options.push { long: 'manifest'
    , description: 'additional manifest definitions'
    , value: true
    , callback: (value) -> (conf_manifest = (JSON.parse value))
    }

  argparser.parse
    help:true
    options:options
    argv:argv

  createTargetDir = (cont) ->
    path.exists targetdir, (exists) ->
      if exists
        logger.error "target directory exists already"
        cont(exists)
      else
        child_process.exec "mkdir -p "+ targetdir , (err,stdout,stderr) ->
          if err?
            logger.error "failed to create target directory"
            cont(err)
          else
            path.exists targetdir, (exists) ->
              if exists
                cont()
              else
                logger.error "failed to create target directory"
                cont(exists)

  getdocListItems = (cont) ->
    reqModifier = (req) ->  req.uri = req.uri + "/_all_docs"; req
    resultEmitter = (resp,body,cont) ->
      cont(null, JSON.parse(body).rows)
    couch_helper.dbOperation connection, reqModifier, null, resultEmitter, cont

  filterOutDesignIds = (dofilter,docListItems, cont) ->
    cont(null, (_.select docListItems, (doc) -> doc.id.match /_design\/.*/))

  processDocs = (docListItems, cont) ->
    docsTracker =  helpers.asynchelper.createTaskTracker ((err) -> cont(err)),{name:"docsTracker"}
    outerDocsTaskDone = docsTracker.createTask()

    downloadDoc = (docListItem, cont) ->
      logger.info "getting: " + (inspect docListItem)
      docid = docListItem.id
      couch_helper.get_doc connection,docid,(err,bodyobj)->
        if err?
          logger.error "getting of doc " + docListItem + " failed with " + err 
          cont(err)
        else cont(null,bodyobj)


    docListItems.forEach (docListItem) ->
      doneDoc = docsTracker.createTask 'doc-' + docListItem.id
      logger.info "download doc: " + docListItem.id
      downloadDoc docListItem, (err,doc) ->
        if err?
          doneDoc(err)
          logger.warn "download doc: " + docListItem.id + " error:" + (inspect err)
        else
          logger.info "writing doc: " + docListItem.id
          writeDesignDoc (
            { dir:targetdir
            , conf_manifest:conf_manifest
            ,  doc:doc
            }), ((err) -> doneDoc(err))


    outerDocsTaskDone()

  # END processDocs 


  # main part
  printFailed = (err,msg) ->
    println "ERROR", "pull failed :",err,msg

  createTargetDir (err) ->
    if err? then printFailed err, "creating target dir";process.exit -1
    else getdocListItems (err,docListItems) ->
      if err? then  printFailed err, "getting doc ids"; process.exit -1
      else
        (docListItems = (_.select docListItems, (doc) -> not doc.id.match /_design\/.*/)) unless pull_designdocs
        (docListItems = (_.select docListItems, (doc) -> doc.id.match /_design\/.*/)) unless pull_datadocs
        processDocs docListItems, (err) ->
          if err? then printFailed "handling doc",err; process.exit -1
          else println "OK", "pull succeeded"

