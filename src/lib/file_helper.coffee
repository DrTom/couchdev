###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

fs = require 'fs'

child_process = require 'child_process'

helpers = require 'drtoms-nodehelpers'
logging = helpers.logging

logger = logging.logger 'couchdev-pull'
#logging.defaultAppenders().forEach (appender)-> appender.level('INFO')


verbosity = 1
exports.setVerbosity = (level) ->
  verbosity = level

###
   readDocument

   reads and parses a JSON document
   continues with the document as an object
###

exports.readDocument = (path,cont) ->
  fs.readFile path,'utf8',(err,data) ->
    if err
      logger.error "reading file"+path, err
      cont(err)
    else
      doc =JSON.parse(data)
      cont(undefined,doc)

exports.mkdeepdir = (dir,cont) ->
  child_process.exec "mkdir -p " + dir, (err) ->
    cont(err)
  

