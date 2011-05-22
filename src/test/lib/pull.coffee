###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###
  

######################
# test - pull 
######################

path = require 'path'
fs = require 'fs'

maindir = path.join(path.dirname(fs.realpathSync(__filename)),'../../')
libdir = maindir + "lib/"
bindir = maindir + "bin/"

testCase = require('nodeunit').testCase

helpers = require 'drtoms-nodehelpers'
println = helpers.printer.println

file_helper = require '../../lib/file_helper.js'
connector= require libdir+"connector"
couch_helper = require libdir+"couch_helper"

child_process = require 'child_process'

exec = child_process.exec

pull = require libdir+'pull'

helpers = require 'drtoms-nodehelpers'
logging = helpers.logging

logger = logging.logger 'couchdev-pulltest'



module.exports = testCase(

  (()->

    testname = "couchdev-test_pull"
    testdir = "test/tmp/" + testname + "/DB"

    conn_para =
      db: testname
    if process.env['CouchUSER']? and process.env['CouchPASS']?
      conn_para['user'] =  process.env['CouchUSER']
      conn_para['pass'] =  process.env['CouchPASS']
    connection = connector.create(conn_para)

    docid='_design/simpleapp'

    "PULL":

      "prepare":

        "deleting the test directory": (test) ->
          child_process.exec "rm -rf " + testdir, (err) ->
            test.ok (not err?) ,"deleting it beforehand"
            test.done()

        "deleting the database": (test) ->
          test.expect 2
          couch_helper.deleteDB connection, (err) ->
            test.ok (not err?) ,"the delete operation must succeed"
            couch_helper.getDB connection,(err)->
              test.ok (err is 404) ,"the database must not exist"
              test.done()

        "creating the database": (test) ->
          test.expect 2
          couch_helper.putDB connection, (err) ->
            test.ok (not err?) ,"the put operation must succeed"
            couch_helper.getDB connection, (err) ->
              test.ok (not err?), "get must succeed"
              test.done()

        "putting the simpleapp document": (test) ->
          cmd = 'curl -X PUT ' + (connection.url {docid:docid}) + ' -d@test/data/simpleApp.json'
          child_process.exec cmd, (err) ->
            test.ok (not err?) ,"the curl -X PUT operation must succeed"
            couch_helper.get_revision connection,docid, (err,rev) ->
              test.ok (not err?) ,"getting revision of the simpleapp doc must not pass an error"
              test.ok (rev isnt null), "and the revision must not be null"
              test.done()

      "pull":

        "pulling": (test) ->
          cmd = bindir + "couchdev pull -b #{testname} -d  #{testdir}"
          exec cmd, (err) ->
            test.ok (not err?) ,"the pull operation must succeed"
            test.done()

        "checking files": (test) ->
          stat = fs.statSync testdir+"/_design/simpleapp/_doc.json"
          test.ok stat.isFile(), "simpleapp.json must be present"
          stat = fs.statSync testdir+"/_design/simpleapp/_attachments/index.html"
          test.ok stat.isFile(), "index.html must be present"
          stat = fs.statSync testdir+"/_design/simpleapp/views/sample/map.js"
          test.ok stat.isFile(), "index.html must be present"
          stat = fs.statSync testdir+"/_design/simpleapp/shows/edit.js"
          test.ok stat.isFile(), "index.html must be present"
          stat = fs.statSync testdir+"/_design/simpleapp/sub/objfile.json"
          test.ok stat.isFile(), "objfile according to couchdev.manifest must bre present"
          test.done()

        "checking remaining contents of /_design/simpleapp/_doc.json": (test) ->
          test.expect 3
          file_helper.readDocument testdir+"/_design/simpleapp/_doc.json", (err,doc)->
            test.ok not err?, "no error"
            test.ok doc.language is "javascript", "the doc.language field is of javascript"
            delete doc.language
            remainder =
              for key,value of doc
                key
            test.ok remainder.length is 0, "there must be nothing than doc.language"
            test.done()


      # comment out the following two tasks for debugging

      "clean-up":

        "deleting the database": (test) ->
          test.expect 2
          couch_helper.deleteDB connection, (err) ->
            test.ok (not err?) ,"the delete operation must :succeed"
            couch_helper.getDB connection,(err)->
              test.ok (err is 404) ,"the database must not exist"
              test.done()

        "deleting the test directory": (test) ->
          child_process.exec "rm -rf " + testdir, (err) ->
            test.ok (not err?) ,"deleting it beforehand"
            test.done()

    "PULL skip design docs":

      "prepare":

        "deleting the test directory": (test) ->
          child_process.exec "rm -rf " + testdir, (err) ->
            test.ok (not err?) ,"deleting it beforehand"
            test.done()

        "deleting the database": (test) ->
          test.expect 2
          couch_helper.deleteDB connection, (err) ->
            test.ok (not err?) ,"the delete operation must succeed"
            couch_helper.getDB connection,(err)->
              test.ok (err is 404) ,"the database must not exist"
              test.done()

        "creating the database": (test) ->
          test.expect 2
          couch_helper.putDB connection, (err) ->
            test.ok (not err?) ,"the put operation must succeed"
            couch_helper.getDB connection, (err) ->
              test.ok (not err?), "get must succeed"
              test.done()

        "putting the simpleapp document": (test) ->
          cmd = 'curl -X PUT ' + (connection.url {docid:docid}) + ' -d@test/data/simpleApp.json'
          child_process.exec cmd, (err) ->
            test.ok (not err?) ,"the curl -X PUT operation must succeed"
            couch_helper.get_revision connection,docid, (err,rev) ->
              test.ok (not err?) ,"getting revision of the simpleapp doc must not pass an error"
              test.ok (rev isnt null), "and the revision must not be null"
              test.done()

      "pull":

        "pulling": (test) ->
          cmd = bindir + "couchdev pull --skip-design-docs -b #{testname} -d  #{testdir}"
          exec cmd, (err) ->
            test.ok (not err?) ,"the pull operation must succeed"
            test.done()

        "checking files": (test) ->
          test.ok not (path.existsSync testdir+"/_design/simpleapp/_doc.json"),"_design/simpleapp/_doc.json must not be present"
          test.done()


      "clean-up":

        "deleting the database": (test) ->
          test.expect 2
          couch_helper.deleteDB connection, (err) ->
            test.ok (not err?) ,"the delete operation must :succeed"
            couch_helper.getDB connection,(err)->
              test.ok (err is 404) ,"the database must not exist"
              test.done()

        "deleting the test directory": (test) ->
          child_process.exec "rm -rf " + testdir, (err) ->
            test.ok (not err?) ,"deleting it beforehand"
            test.done()

  )()
)
