# listing databases in couchdb

http = require('http')
sys = require('sys')

listDBs = (dbs) ->
  console.log "############### DBs in couchdb"
  for db in dbs
    console.log db

couchdb = http.createClient 5984, "localhost"
request = couchdb.request 'GET', '/_all_dbs'

request.on 'response', (response) ->
  console.log "############### HTTP Response:"
  console.log "STATUS: " + response.statusCode
  console.log "HEADERS: " + JSON.stringify response.headers
  if response.statusCode is 200
    response.on 'data', (data) ->
      console.log "DATA: " + data
      listDBs JSON.parse data

request.end()



