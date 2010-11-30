
SYS = require 'sys'
FS = require 'fs'
HTTP = require 'http'
UTIL = require 'util'



print = (obj) ->
  util = require 'util'
  if typeof obj is "string"
    console.log obj
  else
    console.log util.inspect obj

retrievedDesignDoc = (rev) ->
  SYS.inspect rev
  if rev?
    print "have revision"
  else
    print "no revision"

doc = {
  language: 'javascript'
  views:{
    test: {
      map: null
    }
  }
}
   
# rather give retriveal doc structure and
# let it add _rev or not

getRevDoc = (fun) ->
  couchdb = HTTP.createClient 5984, "localhost"
  request = couchdb.request 'GET', '/test/_design/test2/'
  request.on 'response', (response) ->
    print "############### HTTP Response:"
    print  "STATUS: " + response.statusCode
    print "HEADERS: " + JSON.stringify response.headers
    if response.statusCode is 200
      response.on 'data', (data) ->
        print "DATA: " + data
        print JSON.parse(data)
        SYS.inspect JSON.parse(data)
        fun(JSON.parse(data)._rev)
    else
      fun(undefined)
  request.end()



readTree = (fun) ->
  FS.readFile 'tmp/testview/map.js','utf8', (err,data) ->
    print data
    doc.views.test.map = data
    print doc
    fun()
    push()
 

getRevDoc(
  (arg) ->
    print arg
    doc["_rev"] = arg
    readTree () ->
      delete doc._rev if not doc._rev?
)


#couchdb = HTTP.createClient 5984, "localhost"
#request = couchdb.request 'POST', '/test/_design/test2'

push = () ->
  request = require('request')

  h = {'content-type':'application/json', 'accept-type':'application/json'}

  print "######### HEADER"
  print  h
  req = {uri: 'http://admin:test@localhost:5984/test/_design/test2', method:'PUT', body: JSON.stringify(doc), headers: h}

  print "######### REQ"
  print req

  print "######### Go"

  request req, (err,resp,body) ->
    print "########"
    print err
    print resp
    print body


# TODO send it

