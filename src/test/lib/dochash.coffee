###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###
  

child_process = require 'child_process'
path = require 'path'
fs = require 'fs'

exec = child_process.exec
spawn = child_process.spawn

main_dir = path.join(path.dirname(fs.realpathSync(__filename)),'../../')
lib_dir = main_dir + "lib/"
bin_dir = main_dir + "bin/"
connector = require lib_dir+"connector"

couch_helper = require lib_dir + "couch_helper"

helpers = require 'drtoms-nodehelpers'
logging = helpers.logging
logger = logging.logger 'test'

execEnv =
  encoding: 'utf8'
  timeout: 0
  maxBuffer: 200*1024
  killSignal: 'SIGTERM'
  cwd: main_dir
  env: null
 


exports['dochash test'] =

  (() ->

    testname = "couchdev-dochash"

    connPara =
      db: testname
    if process.env['CouchUSER']? and process.env['CouchPASS']?
      connPara['user'] =  process.env['CouchUSER']
      connPara['pass'] =  process.env['CouchPASS']
    connection = connector.create(connPara)

    "executeable filetest" : (test) ->

      exec "./bin/couchdev dochash -f ./test/data/dochash.json  | awk '{print $2}'", execEnv,(err,stdout,sterr) ->
        test.expect 2
        test.ok (not err?),'error must be null'
        md5 = stdout.replace /\n/, ""
        test.equal md5, '11f3df84eb955383ce00867400fa782c', "the hash for the file must be correct"
        test.done()

    "executeable database test":

       "prepare":

          "deleting the database": (test) ->
            test.expect 2
            couch_helper.deleteDB connection, (err) ->
              test.ok (not err?) ,"the delete operation must succeed"
              couch_helper.getDB connection,(err)->
                test.ok (err is 404) ,"the database must not exist"
                test.done()

          "creating the database": (test) ->
            test.expect 2
            couch_helper.putDB connection, (err) ->
              test.ok (not err?) ,"the put operation must succeed"
              couch_helper.getDB connection, (err) ->
                test.ok (not err?), "get must succeed"
                test.done()

          "putting the document": (test) ->
            cmd = "curl -X PUT localhost:5984/#{testname}/test -d @test/data/dochash.json "
            exec cmd, execEnv,(err,stdout,sterr) ->
              test.expect 1
              test.ok (not err?),'error must be null'
              test.done()


       "confirm":
          
          "hashing the document": (test) ->
            exec "couchdev dochash  -b #{testname} -d test | awk '{print $2}'", execEnv,(err,stdout,sterr) ->
              test.expect 2
              test.ok (not err?),'error must be null'
              md5 = stdout.replace /\n/, ""
              test.equal md5, '11f3df84eb955383ce00867400fa782c', "the hash for the file must be correct"
              test.done()

       "clean":

          "deleting the database": (test) ->
            test.expect 2
            couch_helper.deleteDB connection, (err) ->
              test.ok (not err?) ,"the delete operation must succeed"
              couch_helper.getDB connection,(err)->
                test.ok (err is 404) ,"the database must not exist"
                test.done()

)()

  
