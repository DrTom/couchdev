/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var bindir, child_process, connector, couch_helper, exec, file_helper, fs, helpers, libdir, logger, logging, maindir, path, println, pull, testCase;
path = require('path');
fs = require('fs');
maindir = path.join(path.dirname(fs.realpathSync(__filename)), '../../');
libdir = maindir + "lib/";
bindir = maindir + "bin/";
testCase = require('nodeunit').testCase;
helpers = require('drtoms-nodehelpers');
println = helpers.printer.println;
file_helper = require('../../lib/file_helper.js');
connector = require(libdir + "connector");
couch_helper = require(libdir + "couch_helper");
child_process = require('child_process');
exec = child_process.exec;
pull = require(libdir + 'pull');
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('couchdev-pulltest');
module.exports = testCase((function() {
  var conn_para, connection, docid, testdir, testname;
  testname = "couchdev-test_pull";
  testdir = "test/tmp/" + testname + "/DB";
  conn_para = {
    db: testname
  };
  if ((process.env['CouchUSER'] != null) && (process.env['CouchPASS'] != null)) {
    conn_para['user'] = process.env['CouchUSER'];
    conn_para['pass'] = process.env['CouchPASS'];
  }
  connection = connector.create(conn_para);
  docid = '_design/simpleapp';
  return {
    "PULL": {
      "prepare": {
        "deleting the test directory": function(test) {
          return child_process.exec("rm -rf " + testdir, function(err) {
            test.ok(!(err != null), "deleting it beforehand");
            return test.done();
          });
        },
        "deleting the database": function(test) {
          test.expect(2);
          return couch_helper.deleteDB(connection, function(err) {
            test.ok(!(err != null), "the delete operation must succeed");
            return couch_helper.getDB(connection, function(err) {
              test.ok(err === 404, "the database must not exist");
              return test.done();
            });
          });
        },
        "creating the database": function(test) {
          test.expect(2);
          return couch_helper.putDB(connection, function(err) {
            test.ok(!(err != null), "the put operation must succeed");
            return couch_helper.getDB(connection, function(err) {
              test.ok(!(err != null), "get must succeed");
              return test.done();
            });
          });
        },
        "putting the simpleapp document": function(test) {
          var cmd;
          cmd = 'curl -X PUT ' + (connection.url({
            docid: docid
          })) + ' -d@test/data/simpleApp.json';
          return child_process.exec(cmd, function(err) {
            test.ok(!(err != null), "the curl -X PUT operation must succeed");
            return couch_helper.get_revision(connection, docid, function(err, rev) {
              test.ok(!(err != null), "getting revision of the simpleapp doc must not pass an error");
              test.ok(rev !== null, "and the revision must not be null");
              return test.done();
            });
          });
        }
      },
      "pull": {
        "pulling": function(test) {
          var cmd;
          cmd = bindir + ("couchdev pull -b " + testname + " -d  " + testdir);
          return exec(cmd, function(err) {
            test.ok(!(err != null), "the pull operation must succeed");
            return test.done();
          });
        },
        "checking files": function(test) {
          var stat;
          stat = fs.statSync(testdir + "/_design/simpleapp/_doc.json");
          test.ok(stat.isFile(), "simpleapp.json must be present");
          stat = fs.statSync(testdir + "/_design/simpleapp/_attachments/index.html");
          test.ok(stat.isFile(), "index.html must be present");
          stat = fs.statSync(testdir + "/_design/simpleapp/views/sample/map.js");
          test.ok(stat.isFile(), "index.html must be present");
          stat = fs.statSync(testdir + "/_design/simpleapp/shows/edit.js");
          test.ok(stat.isFile(), "index.html must be present");
          stat = fs.statSync(testdir + "/_design/simpleapp/sub/objfile.json");
          test.ok(stat.isFile(), "objfile according to couchdev.manifest must bre present");
          return test.done();
        },
        "checking remaining contents of /_design/simpleapp/_doc.json": function(test) {
          test.expect(3);
          return file_helper.readDocument(testdir + "/_design/simpleapp/_doc.json", function(err, doc) {
            var key, remainder, value;
            test.ok(!(err != null), "no error");
            test.ok(doc.language === "javascript", "the doc.language field is of javascript");
            delete doc.language;
            remainder = (function() {
              var _results;
              _results = [];
              for (key in doc) {
                value = doc[key];
                _results.push(key);
              }
              return _results;
            })();
            test.ok(remainder.length === 0, "there must be nothing than doc.language");
            return test.done();
          });
        }
      },
      "clean-up": {
        "deleting the database": function(test) {
          test.expect(2);
          return couch_helper.deleteDB(connection, function(err) {
            test.ok(!(err != null), "the delete operation must :succeed");
            return couch_helper.getDB(connection, function(err) {
              test.ok(err === 404, "the database must not exist");
              return test.done();
            });
          });
        },
        "deleting the test directory": function(test) {
          return child_process.exec("rm -rf " + testdir, function(err) {
            test.ok(!(err != null), "deleting it beforehand");
            return test.done();
          });
        }
      }
    },
    "PULL skip design docs": {
      "prepare": {
        "deleting the test directory": function(test) {
          return child_process.exec("rm -rf " + testdir, function(err) {
            test.ok(!(err != null), "deleting it beforehand");
            return test.done();
          });
        },
        "deleting the database": function(test) {
          test.expect(2);
          return couch_helper.deleteDB(connection, function(err) {
            test.ok(!(err != null), "the delete operation must succeed");
            return couch_helper.getDB(connection, function(err) {
              test.ok(err === 404, "the database must not exist");
              return test.done();
            });
          });
        },
        "creating the database": function(test) {
          test.expect(2);
          return couch_helper.putDB(connection, function(err) {
            test.ok(!(err != null), "the put operation must succeed");
            return couch_helper.getDB(connection, function(err) {
              test.ok(!(err != null), "get must succeed");
              return test.done();
            });
          });
        },
        "putting the simpleapp document": function(test) {
          var cmd;
          cmd = 'curl -X PUT ' + (connection.url({
            docid: docid
          })) + ' -d@test/data/simpleApp.json';
          return child_process.exec(cmd, function(err) {
            test.ok(!(err != null), "the curl -X PUT operation must succeed");
            return couch_helper.get_revision(connection, docid, function(err, rev) {
              test.ok(!(err != null), "getting revision of the simpleapp doc must not pass an error");
              test.ok(rev !== null, "and the revision must not be null");
              return test.done();
            });
          });
        }
      },
      "pull": {
        "pulling": function(test) {
          var cmd;
          cmd = bindir + ("couchdev pull --skip-design-docs -b " + testname + " -d  " + testdir);
          return exec(cmd, function(err) {
            test.ok(!(err != null), "the pull operation must succeed");
            return test.done();
          });
        },
        "checking files": function(test) {
          test.ok(!(path.existsSync(testdir + "/_design/simpleapp/_doc.json")), "_design/simpleapp/_doc.json must not be present");
          return test.done();
        }
      },
      "clean-up": {
        "deleting the database": function(test) {
          test.expect(2);
          return couch_helper.deleteDB(connection, function(err) {
            test.ok(!(err != null), "the delete operation must :succeed");
            return couch_helper.getDB(connection, function(err) {
              test.ok(err === 404, "the database must not exist");
              return test.done();
            });
          });
        },
        "deleting the test directory": function(test) {
          return child_process.exec("rm -rf " + testdir, function(err) {
            test.ok(!(err != null), "deleting it beforehand");
            return test.done();
          });
        }
      }
    }
  };
})());