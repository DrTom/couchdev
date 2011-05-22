# save design document


http = require 'http'
sys = require 'sys'
fs = require 'fs'


args =
  dir : "./tmp"
  db : undefined
  desdoc : undefined


saveData = (data) ->
  red   = '\033[0;31m'
  reset = '\033[0m'
  try
    fs.mkdirSync(args.dir, 511)
  catch error
    console.log red + error + reset
  for view of data.views
	  try
	    fs.mkdirSync(args.dir+"/"+view, 511)
	  catch error
	    console.log red + error + reset
    map = data.views[view].map
    if map?
      fs.writeFile args.dir+'/'+view+'/map.js', map,  (err) ->
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


fetch = (db,desdoc) ->

  couchdb = http.createClient 5984, "localhost"
  request = couchdb.request 'GET', '/'+db+'/_design/'+desdoc

  console.log 'GET', '/'+db+'/_design/'+desdoc

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


#########################################



opts = require 'opts'

options = [
  { short: 'b'
  , long: 'database'
  , description: 'name of the database'
  , value: true
  , required: true
  , callback: (value) -> args.db = value
  },
  { short: 'd'
  , long: 'targetdir'
  , description: 'target directory, default: "'+args.dir+'"'
  , value: true
  , callback: (value) -> args.dir = value
  },
  { short: 's'
  , long: 'designdoc'
  , description: 'design doc'
  , value: true
  , required: true
  , callback: (value) -> args.desdoc = value
  }
]

opts.parse options, true

fetch(args.db,args.desdoc)
