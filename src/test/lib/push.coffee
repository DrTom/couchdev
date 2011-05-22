###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###
  

######################
# push - tests
######################

path = require 'path'
fs = require 'fs'

maindir = path.join(path.dirname(fs.realpathSync(__filename)),'../../')
libdir = maindir + "lib/"
bindir = maindir + "bin/"

testCase = require('nodeunit').testCase

connector = require libdir+"connector"
couch_helper = require libdir+"couch_helper"

child_process = require 'child_process'
exec = child_process.exec

helpers = require 'drtoms-nodehelpers'
println = helpers.printer.println

pull = require libdir+'pull'


helpers = require 'drtoms-nodehelpers'
logging = helpers.logging

logger = logging.logger 'couchdev-pulltest'


module.exports = testCase(

  (()->

    testname = "couchdev-test_push"
    sourcedir = "test/data/simpleApp/DB"

    connPara =
      db: testname
    if process.env['CouchUSER']? and process.env['CouchPASS']?
      connPara['user'] =  process.env['CouchUSER']
      connPara['pass'] =  process.env['CouchPASS']
    connection = connector.create(connPara)

    docid='_design/simpleapp'

    "PUSH":

      "prepare":

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


      "push":

        "push": (test) ->
          cmd = bindir + "couchdev push -b #{testname} -d  #{sourcedir}"
          exec cmd, (err) ->
            test.ok (not err?) ,"the push operation must succeed"
            test.done()

        "attachments":

          "index.html": (test) ->
            cmd ="curl -i http://localhost:5984/#{connPara.db}/#{docid}/index.html"
            exec cmd, (err,stdout,stderr) ->
              test.ok (not err?) ,"curl on attachment must succeed "
              test.ok stdout.match /Content-Type: text\/html/, "content type html"
              test.ok stdout.match /Hello Couchi!/, "content"
              test.done()

          "style/wiki.css": (test) ->
            cmd ="curl -i localhost:5984/#{connPara.db}/#{docid}/style/wiki.css"
            exec cmd, (err,stdout,stderr) ->
              test.ok (not err?) ,"curl on attachment must succeed "
              test.ok stdout.match /Content-Type: text\/css/, "content type css"
              test.ok stdout.match /background-color: #f8f8f8;/, "content"
              test.done()

        "document" : (test) ->
          couch_helper.get_doc connection,docid, (err,retdoc) ->
            test.ok not err?, "getting the document must not pass an error"
            test.ok retdoc?, "getting the document must pass an document"
            test.ok retdoc.shows.edit is "function(doc, req) {}", ".show.edit must match filecontent"
            test.ok retdoc.sub.objfile.sumenum is 42 , "42 is in doc"
            test.done()


      "clean":

        "deleting the database": (test) ->
          test.expect 2
          couch_helper.deleteDB connection, (err) ->
            test.ok (not err?) ,"the delete operation must succeed"
            couch_helper.getDB connection,(err)->
              test.ok (err is 404) ,"the database must not exist"
              test.done()


  )()
)
