/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var create, get_options, helpers, logger, logging;
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('couchdev-connector');
create = function(args) {
  return (function() {
    return {
      host: (args != null) && (args.host != null) ? args.host : 'localhost',
      port: (args != null) && (args.port != null) ? args.port : '5984',
      db: (args != null) && (args.db != null) ? args.db : 'test',
      pass: (args != null) && (args.pass != null) ? args.pass : void 0,
      user: (args != null) && (args.user != null) ? args.user : void 0,
      url: function(arg) {
        return "http://" + (this.user != null ? this.user + ":" + this.pass + "@" : "") + this.host + ":" + this.port + "/" + this.db + ((arg != null) && (arg.docid != null) ? "/" + arg.docid : "") + ((arg != null) && (arg.docid != null) && (arg.attachments != null) ? "?attachments=true" : "");
      },
      clone: function() {
        return create(this);
      }
    };
  })();
};
exports.create = create;
get_options = function(conn) {
  return [
    {
      short: 'h',
      long: 'host',
      description: 'name of the host',
      value: true,
      required: false,
      callback: function(value) {
        return conn.host = value;
      }
    }, {
      short: 'b',
      long: 'database',
      description: 'name of the database',
      value: true,
      required: false,
      callback: function(value) {
        return conn.db = value;
      }
    }, {
      short: 'u',
      long: 'user',
      description: 'user for CouchDB login',
      value: true,
      callback: function(value) {
        return conn.user = value;
      }
    }, {
      short: 'p',
      long: 'pass',
      description: 'password for CouchDB login',
      value: true,
      callback: function(value) {
        return conn.pass = value;
      }
    }, {
      short: 't',
      long: 'port',
      description: 'port',
      value: true,
      callback: function(value) {
        return conn.port = value;
      }
    }
  ];
};
exports.get_options = get_options;