print = (obj) ->
  util = require 'util'
  if typeof obj is "string"
    console.log obj
  else if typeof obj is "function"
    console.log "Function:" +obj.name
    console.log util.inspect obj
  else
    console.log util.inspect obj
  true

cont = () ->
  print "\n---- continuation invoker ----"
  print "--arguments--"
  print arguments
  [continuation,rest...] = arguments
  print "--continuation--"
  print continuation
  print "--rest--"
  print rest
  continuation.apply(this,rest)

doc="http://admin:test@localhost:5984/test/_design/test"

upload = (req,cont) ->
  print "####### uploading ######, Request"
  print req
  request = require('request')
  request req, (err,resp,body) ->
    if err?
      print err
    else
      print "######## Uploading Success ######, rec. body:"
      print body

getRev = (doc,fun,continuations...) ->
  print "####### getting revision ###### "
  request = require('request')
  request {uri:doc}, (err,resp,body) ->
    if err?
      print err
    else
      print "####### getting revision SUCCESS######, rec. body: "
      print JSON.parse(body)
      if resp.statusCode is 200
        fun.apply(this,[JSON.parse(body)._rev].concat(continuations))

readAttachment = (path,cb) ->
  print "####### reading attachment ###### "
  fs = require 'fs'
  fs.readFile path, (err,data) ->
    if err
      print "ERROR:"
      print err
    else
      cb(data:data,ctype:"text/plain")


buildRequest = (fileData,rev,cont) ->
  print "####### building request ###### "
  req =
    uri: doc+"/bla.txt?rev="+rev
    method: "PUT"
    body: fileData.data
    headers:
      'content-type': fileData.ctype
  cont(req)

_fileData = null


requestBuiltEvent = (req) ->
  upload(req)

revisionReceivedEvent = (rev) ->
  print rev
  buildRequest(_fileData,rev,requestBuiltEvent)

attachmentReadEvent = (data) ->
  _fileData = data
  print data
  getRev(doc,revisionReceivedEvent)



# start the upload chain
#   readAttachment -> getRev -> buildRequest -> upload
readAttachment('tmp/_attachments/bla.txt',attachmentReadEvent)

