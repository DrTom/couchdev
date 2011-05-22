###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

helpers = require 'drtoms-nodehelpers'
logging = helpers.logging
logger = logging.logger 'couchdev-connector'


create = (args) ->

  ( ->

    host: if args? and args.host? then args.host else 'localhost'

    port: if args? and args.port? then args.port else '5984'

    db: if args? and args.db? then args.db else 'test'

    pass: if args? and args.pass? then args.pass

    user: if args? and args.user? then args.user

    url: (arg) -> "http://" +
      (if this.user? then (this.user + ":" + this.pass + "@" ) else "") +
      this.host + ":" + this.port + "/" + this.db +
      (if arg? and arg.docid? then  "/" + arg.docid  else "") +
      (if arg? and arg.docid? and arg.attachments? then "?attachments=true" else "")

    clone: -> create(this)
    
  )()

exports.create = create


get_options = (conn) ->
  [ { short: 'h'
    , long: 'host'
    , description: 'name of the host'
    , value: true
    , required: false
    , callback: (value) -> conn.host = value
    }
  , { short: 'b'
    , long: 'database'
    , description: 'name of the database'
    , value: true
    , required: false
    , callback: (value) -> conn.db = value
    }
  , { short:'u'
    , long: 'user'
    , description: 'user for CouchDB login'
    , value: true
    , callback:  (value) -> conn.user = value
    }
  , { short:'p'
    , long: 'pass'
    , description: 'password for CouchDB login'
    , value: true
    , callback:  (value) -> conn.pass = value
    }
  , { short:'t'
    , long: 'port'
    , description: 'port'
    , value: true
    , callback:  (value) -> conn.port = value
    }
  ]

exports.get_options = get_options
