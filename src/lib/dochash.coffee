###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

path = require 'path'
fs = require 'fs'

main_dir = path.join(path.dirname(fs.realpathSync(__filename)),'../')
lib_dir = main_dir + "lib/"

connector = require lib_dir + 'connector'

#
# Module, require ...
helper = require './helper'
md5_check = helper.md5_check

file_helper = require './file_helper'
file = undefined
docid = undefined

couch_helper = require lib_dir + 'couch_helper'

connection = connector.create()

helpers = require 'drtoms-nodehelpers'
argparser = helpers.argparser
println = helpers.printer.println


setFile = (value) ->
  connection = undefined
  file = value


processDocument = (err,doc) ->
  if err?
    println "ERR", err
    process.exit 1
  md5 = md5_check.docMd5 doc
  pref = if connection? then ( connection.url() + "/" + docid ) else file
  println pref + " " + md5

exports.run = () ->

  options = (
    [{ short: 'f'
      , long: 'file'
      , description: 'path to CouchDB JSON document'
      , value: true
      , callback: setFile
      }
    , { short: 'd'
      , long: 'document'
      , value: true
      , callback: (value) -> docid = value
      }
    ]).concat(connector.get_options(connection))

  argparser.parse
    help: true
    options: options

  if file?
    file_helper.readDocument file, processDocument
  else
   couch_helper.get_doc connection,docid, processDocument



