PATH = require 'path'
FS = require 'fs'

MAINDIR = PATH.join(PATH.dirname(FS.realpathSync(__filename)),'../../')
LIBDIR = MAINDIR + "lib/"
BINDIR = MAINDIR + "bin/"
TESTDIR = MAINDIR + "test/"
TESTTMPDIR = TESTDIR + "tmp/"

testCase = require('nodeunit').testCase

SIMPLECLI = require 'simplecli'
println = SIMPLECLI.printer.println
    
exec = require('child_process').exec
CONNECTION = require LIBDIR+"connection"

Helper = require LIBDIR+"helper"
CouchHelper = require LIBDIR+"couchHelper"
FileHelper = require LIBDIR + "file_helper"

pull = require LIBDIR+"pull"

module.exports = testCase((()->

  #connection
  connPara = {
    db: "test-couchdev-pull-couchappsample"
  }

  if process.env['CouchUSER']? and process.env['CouchPASS']?
    connPara['user'] =  process.env['CouchUSER']
    connPara['pass'] =  process.env['CouchPASS']

  connection = CONNECTION.createConnection(connPara)


  connPara.doc="_design/couchappsample"
  docConnection = CONNECTION.createConnection(connPara)
  docConnection.requireDoc()

  connParaCouchapp =
    db: "test-couchdev-pull-couchapppush"
  couchapp_connection = CONNECTION.createConnection connParaCouchapp
  connParaCouchapp.doc = "_design/couchappsample"
  couchapp_connection_doc = CONNECTION.createConnection connParaCouchapp
 

  "prepare putting the document":

    "deleting the database": (test) ->
      test.expect 2
      CouchHelper.deleteDB connection, (err) ->
        test.ok (not err?) ,"the delete operation must succeed"
        CouchHelper.getDB connection,(err)->
          test.ok (err is 404) ,"the database must not exist"
          test.done()

    "creating the database": (test) ->
      test.expect 2
      CouchHelper.putDB connection, (err) ->
        test.ok (not err?) ,"the delete operation must succeed"
        CouchHelper.getDB connection, (err) ->
          test.ok (not err?), "get must succeed"
          test.done()

    "uploading (putting) a document": (test) ->
      test.expect 7
      FileHelper.readDocument 'test/data/couchappsample.json',(err,doc) ->
        test.ok not err?, "reading must not pass an error"
        test.ok doc?, "reading must return an non empty document"
        test.ok typeof doc is "object", "doc must be of object"
        CouchHelper.putDoc docConnection, doc,(err,statusCode) ->
          #          CouchHelper.setVerbosity 3
          println err if err?
          test.ok not err?, "putting must not pass an error"
          test.ok (statusCode is 201), "putting must create a resource, i.e. return code 201"
          CouchHelper.getRevision docConnection, (err,revision) ->
            test.ok not err?, "no error must be returned"
            test.ok (revision isnt null), "document must have a revision after creation"
            test.done()

  "couchapp and our PUT equivalence": (test) ->

    exec "which couchapp", (err) ->
      if err?
        println "WARN: python couchapp executable not found; will not perform equivalence test;"
        test.done()
      else
        test.expect 5
        CouchHelper.deleteDB couchapp_connection, (err) ->
          test.ok (not err?) ,"the delete operation must succeed"
          CouchHelper.getDB couchapp_connection,(err)->
            test.ok (err is 404) ,"the database must not exist"

            execEnv =
              encoding: 'utf8'
              timeout: 0
              maxBuffer: 200*1024
              killSignal: 'SIGTERM'
              cwd: MAINDIR+"test/data/couchappsample"
              env: null
             
            exec "couchapp push",execEnv ,(err,stdout,stderr) ->
              if err?
                println "WARN: failed to push with couchapp; it will fail if couchDB has no admin-party"
                # never actually seen this warning, couchapp seems not to return proper values"
              else
                CouchHelper.getDoc docConnection, (err,ourdoc) ->
                  test.ok not err?, "getting the by us pushed document must not pass an error"
                  CouchHelper.getDoc couchapp_connection_doc, (err,couchappdoc) ->
                    test.ok not err?, "getting the couchapp pushed document must not pass an error"
                    test.ok  (Helper.Md5Check.docsEqual ourdoc, couchappdoc), "the docs must be equivalent"
                    test.done()
 
  "pulling the couchapp sample": (test) ->
    

    targetdir = TESTTMPDIR + connParaCouchapp.db

    exec "rm -rf "+targetdir, (err,stdout,stderr) ->
      test.ok not err?, "deleting targetdir must have succeeded"
      cmd = "couchdev pull --database "+connParaCouchapp.db+" --targetdir "+targetdir
      exec cmd, (err,stdout,stderr) ->
        test.ok not err?, "pulltargetdir must have succeeded, command: "+cmd
        test.done()

  "diffs to the couchapp sample": (test) ->

    ODIR = MAINDIR+"test/data/couchappsample/"
    PDIR = MAINDIR+"test/tmp/test-couchdev-pull-couchapppush/DB/_design/couchappsample/"

    exec "diff --recursive --brief "+ODIR+"views "+PDIR+"views", (err,stdout,stderr) ->
      test.ok not err?, "diff on views should have succeeded"
      test.ok not stdout.match /\w/, "no diff on views "
      cmd = "diff -B -w --recursive --brief "+ODIR+"vendor/couchapp/lib "+PDIR+"vendor/couchapp/lib"
      exec cmd, (err,stdout,stderr) ->
        test.ok not err?, "diff on vendor/lib should have succeeded"
        test.ok not stdout.match /\w/, "no diff on vendor/lib"
        test.done()


)())
