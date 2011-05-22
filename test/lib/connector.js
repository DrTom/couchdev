/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var connector, fs, helpers, lib_dir, logger, logging, main_dir, path, testCase;
fs = require('fs');
path = require('path');
main_dir = path.join(path.dirname(fs.realpathSync(__filename)), '../../');
lib_dir = main_dir + "lib/";
connector = require(lib_dir + "connector");
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('test');
testCase = require('nodeunit').testCase;
module.exports = testCase((function() {
  var params;
  params = {
    host: "testhost",
    port: "1234",
    pass: "secret",
    user: "admin",
    db: "mydb"
  };
  return {
    'settings': function(test) {
      var conn;
      conn = connector.create(params);
      test.ok(conn.url().match(/http:\/\/admin:secret@testhost:1234\//, "all settings manifest"));
      return test.done();
    },
    'reset': function(test) {
      var conn;
      conn = connector.create(params);
      conn.host = "myhost";
      test.ok(conn.url().match(/http:\/\/admin:secret@myhost:1234\//, "host-part must have changed in url"));
      return test.done();
    },
    'document arguments': function(test) {
      var conn;
      conn = connector.create(params);
      test.ok(conn.url({
        docid: "_design/bla"
      }).match(/http:\/\/admin:secret@testhost:1234\/mydb\/_design\/bla/, "document argument should manifest"));
      test.ok(conn.url({
        docid: "_design/bla",
        attachments: true
      }).match(/http:\/\/admin:secret@testhost:1234\/mydb\/_design\/bla\?attachments=true/, "attachments argument should manifest"));
      return test.done();
    },
    'clone': function(test) {
      var conn, conn_cloned;
      conn = connector.create(params);
      conn_cloned = conn.clone();
      conn_cloned.host = "myhost";
      test.ok(conn.url().match(/http:\/\/admin:secret@testhost:1234\//, "original should not change"));
      test.ok(conn_cloned.url().match(/http:\/\/admin:secret@myhost:1234\//, "reset clone should have new host value"));
      return test.done();
    },
    'options': function(test) {
      var conn, opt, opts, _fn, _i, _len;
      conn = connector.create(params);
      opts = connector.get_options(conn);
      _fn = function(opt) {
        if (opt.long === 'host') {
          return opt.callback("myhost");
        }
      };
      for (_i = 0, _len = opts.length; _i < _len; _i++) {
        opt = opts[_i];
        _fn(opt);
      }
      test.ok(conn.url().match(/http:\/\/admin:secret@myhost:1234\//, "setting the host via options"));
      return test.done();
    }
  };
})());