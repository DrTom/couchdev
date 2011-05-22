###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

_ = require 'underscore'
crypto = require 'crypto'
fs = require 'fs'

exports.getEnvVar = (name) ->
  process.env[name]

exports.readDocument = (path,cont) ->
  fs.readFile path,'utf8',(err,data) ->
    if err
      println "ERR", "reading file"+path, err
      cont(err)
    else
      doc =JSON.parse(data)
      cont(undefined,doc)

md5_check = ->

  _cleanCouchdoc = (_doc) ->
    doc = _.clone(_doc)
    delete doc._id
    delete doc._rev
    for name, att of doc._attachments
      delete att.revpos
    if doc.couchapp?
      delete doc.couchapp.manifest
      delete doc.couchapp.signatures
    doc

  _md5 = (data) -> crypto.createHash('md5').update(data).digest('hex')

  _docMd5 = (doc) -> _md5(JSON.stringify(_cleanCouchdoc(doc)))

  _docsEqual = (doc1,doc2) -> _docMd5(doc1) is _docMd5(doc2)

  cleanCouchdoc : _cleanCouchdoc
  docsEqual : _docsEqual
  docMd5 : _docMd5

exports.md5_check = md5_check()

# returns last object of a path;
# creates subobjects if they don't exist 
# Example input: obj, "x/y/z/"
#        return: obj.x.y.z
#
lastObjPath = (obj,path) ->
  # println "DEBUG", "lastObjPath ARGUMENTS:", arguments
  if path is ""
    obj
  else
    next = path.match(/[^\/]*/)[0]
    remainder = path.replace /[^\/]*\//, ""
    if not obj[next]?
      obj[next] = {}
    lastObjPath( obj[next] ,remainder)


exports.lastObjPath = lastObjPath

recursiveDeleteEmptyObjects = (obj) ->
  hasSubobjects = (obj)->
    if typeof obj isnt 'object' then true
    else
      sub =
        for key, value of obj
          key
      if sub.length is 0 then false
      else true

  if 'object' isnt typeof obj
  else
    for key, value of obj
      recursiveDeleteEmptyObjects value

    for key, value of obj
      if not hasSubobjects value
        delete obj[key]


exports.recursiveDeleteEmptyObjects = recursiveDeleteEmptyObjects
 

# merges properties of o2 into o1
# mutates o1, 
# in case of confict a property of o2 will overwrite the property in o1
recursiveMerge = (o1,o2) ->

  if typeof o1 isnt 'object' or typeof o2 isnt 'object'
    throw 'can only merge objects'
  else
    for k,v of o2
      if o1[k]? and typeof o1[k] is 'object' and typeof v is 'object'
        recursiveMerge o1[k], o2[k]
      else
        o1[k]=v
  o1

exports.recursiveMerge = recursiveMerge
