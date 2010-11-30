# listing databases in couchdb

http = require 'http'
sys = require 'sys'
fs = require 'fs'

saveData = (data) ->
  red   = '\033[0;31m'
  reset = '\033[0m'
  try
    fs.mkdirSync("tmp/", 511)
  catch error
    console.log red + error + reset
  for view of data.views
	  try
	    fs.mkdirSync("tmp/"+view, 511)
	  catch error
	    console.log red + error + reset
    map = data.views[view].map
    if map?
      fs.writeFile 'tmp/'+view+'/map.js', map,  (err) ->
        if err
          throw err
        console.log 'saved!'

    reduce = data.views[view].reduce

showData = (data) ->
  console.log data
  console.log data.views
  for view of data.views
    console.log view
    map = data.views[view].map
    reduce = data.views[view].reduce
    console.log data.views[view]
    console.log "MAP: " + map
    console.log "REDUCE: " + reduce

couchdb = http.createClient 5984, "localhost"
request = couchdb.request 'GET', '/test/_design/test'

request.on 'response', (response) ->
  console.log "############### HTTP Response:"
  console.log "STATUS: " + response.statusCode
  console.log "HEADERS: " + JSON.stringify response.headers
  if response.statusCode is 200
    response.on 'data', (data) ->
      console.log "DATA: " + data
      sys.inspect data
      showData JSON.parse data
      saveData JSON.parse data

request.end()



