###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###
  

fs = require 'fs'
path = require 'path'

main_dir = path.join(path.dirname(fs.realpathSync(__filename)),'../../')
lib_dir = main_dir + "lib/"

connector = require lib_dir+"connector"


helpers = require 'drtoms-nodehelpers'
logging = helpers.logging
logger = logging.logger 'test'



testCase = require('nodeunit').testCase

module.exports = testCase( (()->

    params = { host:"testhost"
        , port:"1234"
        , pass:"secret"
        , user:"admin"
        , db:"mydb"
      }


    'settings': (test)->

      conn = connector.create(params)

      test.ok conn.url().match /http:\/\/admin:secret@testhost:1234\//, "all settings manifest"

      test.done()

    'reset' :(test)->

      conn = connector.create(params)

      conn.host = "myhost"

      test.ok conn.url().match /http:\/\/admin:secret@myhost:1234\//, "host-part must have changed in url"

      test.done()


    'document arguments': (test)->

      conn = connector.create(params)

      test.ok conn.url({docid:"_design/bla"}).match /http:\/\/admin:secret@testhost:1234\/mydb\/_design\/bla/, "document argument should manifest"

      test.ok conn.url({docid:"_design/bla",attachments:true}).match /http:\/\/admin:secret@testhost:1234\/mydb\/_design\/bla\?attachments=true/, "attachments argument should manifest"

      test.done()
      

    'clone' :(test)->

      conn = connector.create(params)

      conn_cloned= conn.clone()

      conn_cloned.host = "myhost"

      test.ok conn.url().match /http:\/\/admin:secret@testhost:1234\//, "original should not change"

      test.ok conn_cloned.url().match /http:\/\/admin:secret@myhost:1234\//, "reset clone should have new host value"

      test.done()

    'options':(test)->

      conn = connector.create(params)

      opts = connector.get_options(conn)

      for opt in opts
        do (opt) ->
          (opt.callback "myhost") if opt.long is 'host'

      test.ok conn.url().match /http:\/\/admin:secret@myhost:1234\//, "setting the host via options"

      test.done()


)())


