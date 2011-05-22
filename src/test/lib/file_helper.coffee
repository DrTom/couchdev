###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

file_helper = require '../../lib/file_helper.js'

helpers = require 'drtoms-nodehelpers'
println = helpers.printer.println

mkdeepdir = file_helper.mkdeepdir
recursiveFileVisitor = file_helper.recursiveFileVisitor


exports["file helper"] =
  "reading a document": (test) ->
    test.expect 3
    file_helper.readDocument 'test/data/simpleApp.json',(err,doc) ->
      test.ok not err?, "must not pass an error"
      test.ok doc?, "must return an non empty document"
      test.ok typeof doc is "object", "doc must be of object"
      test.done()

