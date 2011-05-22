###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

request = require 'request'

helpers = require 'drtoms-nodehelpers'
logging = helpers.logging

logger = logging.logger 'couchdev-couch_helper'
#logging.defaultAppenders().forEach (appender)-> appender.level('INFO')


if process.env.LOGLEVEL?
  logging.defaultAppenders().forEach (appender)->
    appender.level(process.env.LOGLEVEL)


# Database Operations: DELETE, PUT, GET, ...

# dbOperation
#    (conn, [verbOrReqModifier],[acceptStatusCode],[resultEmitter],cont)
#
dbOperation = (conn,verbOrReqModifier,acceptStatusCode,resultEmitter,cont) ->
  logger.trace "call dbOperation with arguments:", arguments

  # optional arguments from left to right, except of last argument
  args = Array.prototype.slice.call(arguments)
  cont = args.pop()
  [conn,verbOrReqModifier,acceptStatusCode,resultEmitter] = args

  # building the request object
  req =
    uri:conn.url()
    method: 'GET'
  if (typeof verbOrReqModifier) is 'function'
    req = verbOrReqModifier req
  else if (typeof verbOrReqModifier) is 'string'
    req.method = verbOrReqModifier

  acceptStatusCode = acceptStatusCode ? (code) -> code is 200

  resultEmitter ?  resultEmitter = (resp,body,cont) -> cont(null,resp.statusCode)

# invoking the request
  request req, (err,resp,body) ->
    if err?
      logger.warn "request returned with error: ", err
      cont(err) if cont?
    else
      if acceptStatusCode resp.statusCode
        resultEmitter(resp,body,cont)
      else
        cont(resp.statusCode,{statusCode:resp.statusCode,body:body})

exports.dbOperation = dbOperation

exports.getDB = (conn,cont) ->
  dbOperation  conn, cont

exports.putDB= (conn,cont) ->
  acceptStatusCode = (code) -> code is 200 or code is 201
  dbOperation  conn, "PUT", acceptStatusCode, cont

exports.deleteDB = (conn,cont) ->
  acceptStatusCode = (code) -> code is 200 or code is 404
  dbOperation  conn, "DELETE", acceptStatusCode, cont


# Documents: GET, PUT, DELETE, get_revision
 
# docOp
#    (conn, [verbOrReqModifier],[acceptStatusCode],[resultEmitter],cont)
#
doc_operation = (url,verbOrReqModifier,acceptStatusCode,resultEmitter,cont) ->
  logger.trace "call doc_operation with arguments:", arguments

  # optional arguments from left to right, except of last argument
  args = Array.prototype.slice.call(arguments)
  cont = args.pop()
  [url,verbOrReqModifier,acceptStatusCode,resultEmitter] = args

  acceptStatusCode ?  acceptStatusCode = (code) -> code is 200

  resultEmitter ?  resultEmitter = (resp,body,cont) -> cont(null,body)

  req = (uri:url)

  if (typeof verbOrReqModifier) is 'function'
    req = verbOrReqModifier req
  if (typeof verbOrReqModifier ) is 'string'
    req.verb = verbOrReqModifier

  request req, (err,resp,body) ->
    if err?
      logger.warn "request returned with error: ", err
      cont({"doc_operation":"failed","err":err}) if cont?
    else
      logger.info "resp.statusCode: " + resp.statusCode
      logger.trace "body: ", body
      if acceptStatusCode resp.statusCode
        resultEmitter(resp,body,cont)
      else
        logger.warn "status code " + resp.statusCode + " not accepted"
        logger.debug "RESPONSE: ",resp.toString()
        cont(["doc_operation failed with statusCode "+resp.statusCode,{"body":body}])

exports.doc_operation = doc_operation

get_revision = (conn,docid, cont) ->
  logger.trace "call get_revision with arguments:", arguments
  acceptStatusCode = (code) -> code is 200 or code is 404
  resultEmitter =  (resp,body,cont) ->
    if resp.statusCode is 200
      cont undefined, (JSON.parse body)._rev
    else if resp.statusCode is 404
      cont undefined,  null
  doc_operation (conn.url {docid:docid}), "GET", acceptStatusCode, resultEmitter, cont
exports.get_revision = get_revision

exports.get_doc = (conn,docid, cont) ->
  logger.trace "call get_doc with arguments:", arguments
  acceptStatusCode = (code) -> code is 200
  resultOperator =  (resp,body,cont) ->
    cont null, (JSON.parse body)
  doc_operation (conn.url {docid:docid,attachments:true}), "GET", acceptStatusCode, resultOperator, cont


exports.put_doc= (conn,docid,doc,cont) ->
  logger.trace "call put_doc with arguments:", arguments
  get_revision conn,docid,(err,rev) ->
    if err?
      logger.warn err
      cont {"put_doc":"failed get_revision","err":err}
    else
      doc._rev = rev if rev?
      acceptStatusCode = (code) -> code is 201
      reqModifier = (req) ->
        req =
          headers: {'content-type':'application/json', 'accept-type':'application/json'}
          uri: (conn.url {docid:docid})
          body: JSON.stringify(doc)
          method: 'PUT'
      resultOperator =  (resp,body,cont) ->
        cont null, resp.statusCode
      doc_operation null, reqModifier, acceptStatusCode, resultOperator, cont

exports.delete_doc = (conn,docid,cont) ->
  logger.trace "call delete_doc with arguments:", arguments
  get_revision conn,docid, (err,rev) ->
    if err
      logger.warn err
      cont err
    else
      acceptStatusCode = (code) -> code is 200 or code is 404
      reqModifier = (req) ->
        req =
          uri: (conn.url {docid:docid}) + "?rev=" + rev
          method: 'DELETE'
      resultOperator =  (resp,body,cont) ->
        cont null, resp.statusCode
      doc_operation null, reqModifier, acceptStatusCode, resultOperator, cont


