###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###
  

path = require 'path'
fs = require 'fs'

mainDir = path.join(path.dirname(fs.realpathSync(__filename)),'../../')
libDir = mainDir + "lib/"

testCase = require('nodeunit').testCase

connector = require libDir+"connector"
couch_helper = require libDir+"couch_helper"


#
# CRUD Cycle
#
# the whole thing this is less about unit testing 
# more like an acceptance test
#

module.exports = testCase(

  # little trick, we use lambda/closure to set some properties once
  # 'setUp' and 'tearDown' could be used alternatively
  (() ->

    # connection
    conn_para =
      db: "couchdev-test_crud"
    if process.env['CouchUSER']? and process.env['CouchPASS']?
      conn_para['user'] =  process.env['CouchUSER']
      conn_para['pass'] =  process.env['CouchPASS']
    connection = connector.create(conn_para)

    docid="testdoc"
    doc = {name:"Joe"}

    "couch_helper":

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
          test.ok (not err?) ,"the delete operation must succeed"
          couch_helper.getDB connection, (err) ->
            test.ok (not err?), "get must succeed"
            test.done()

      "getting the revision of an not existing document": (test) ->
        test.expect 2
        couch_helper.get_revision connection,docid,(err,rev) ->
          test.ok not err?, "no error must be returned"
          test.ok (rev is null), "revision must be null"
          test.done()


      "uploading (putting) a document": (test) ->
        test.expect 4
        couch_helper.put_doc connection, docid,doc,(err,statusCode) ->
          test.ok not err?, "must not pass an error"
          test.ok (statusCode is 201), "must create a resource, i.e. return code 201"
          couch_helper.get_revision connection,docid, (err,revision) ->
            test.ok not err?, "no error must be returned"
            test.ok (revision isnt null), "document must have a revision after creation"
            test.done()

      "getting and updating the document": (test) ->
        test.expect 6
        couch_helper.get_doc connection, docid, (err,retdoc) ->
          test.ok not err?, "getting the document must not pass an error"
          test.ok retdoc?, "getting the document must pass an document"
          delete retdoc._rev
          delete retdoc._id
          test.deepEqual retdoc, doc
          retdoc.age=21
          # NOTE: put_doc doesn't care if the doc exists and with whatever revision it exists or not
          # it overwrites! this behaviour is intended
          couch_helper.put_doc connection, docid,retdoc, (err) ->
            test.ok not err?, "updating the document must not pass an error"
            couch_helper.get_doc connection, docid, (err,updatedDoc) ->
              test.ok not err?, "getting the updated document must not pass an error"
              test.ok updatedDoc.age is 21, "the updated doc must have the added property"
              test.done()

      "deleting the document": (test) ->
        test.expect 4
        couch_helper.delete_doc connection,docid, (err,code)->
          test.ok not err?, "deleting the document must not pass an error"
          test.ok code is 200, "and the status code must be 200"
          couch_helper.delete_doc connection,docid, (err,code)->
            test.ok not err?, "deleting the document again must not pass an error"
            test.ok code is 404, "howver the status code must be 404"
            test.done()

      "finally deleting the database": (test) ->
        test.expect 2
        couch_helper.deleteDB connection, (err) ->
          test.ok (not err?) ,"the delete operation must succeed"
          couch_helper.getDB connection,(err)->
            test.ok (err is 404) ,"the database must not exist"
            test.done()

  )()
)
