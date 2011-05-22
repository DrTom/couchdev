/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var bindir, child_process, connector, couch_helper, exec, fs, helpers, libdir, logger, logging, maindir, path, println, pull, testCase;
path = require('path');
fs = require('fs');
maindir = path.join(path.dirname(fs.realpathSync(__filename)), '../../');
libdir = maindir + "lib/";
bindir = maindir + "bin/";
testCase = require('nodeunit').testCase;
connector = require(libdir + "connector");
couch_helper = require(libdir + "couch_helper");
child_process = require('child_process');
exec = child_process.exec;
helpers = require('drtoms-nodehelpers');
println = helpers.printer.println;
pull = require(libdir + 'pull');
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('couchdev-pulltest');
module.exports = testCase((function() {
  var connPara, connection, docid, sourcedir, testname;
  testname = "couchdev-test_push";
  sourcedir = "test/data/simpleApp/DB";
  connPara = {
    db: testname
  };
  if ((process.env['CouchUSER'] != null) && (process.env['CouchPASS'] != null)) {
    connPara['user'] = process.env['CouchUSER'];
    connPara['pass'] = process.env['CouchPASS'];
  }
  connection = connector.create(connPara);
  docid = '_design/simpleapp';
  return {
    "PUSH": {
      "prepare": {
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
        }
      },
      "push": {
        "push": function(test) {
          var cmd;
          cmd = bindir + ("couchdev push -b " + testname + " -d  " + sourcedir);
          return exec(cmd, function(err) {
            test.ok(!(err != null), "the push operation must succeed");
            return test.done();
          });
        },
        "attachments": {
          "index.html": function(test) {
            var cmd;
            cmd = "curl -i http://localhost:5984/" + connPara.db + "/" + docid + "/index.html";
            return exec(cmd, function(err, stdout, stderr) {
              test.ok(!(err != null), "curl on attachment must succeed ");
              test.ok(stdout.match(/Content-Type: text\/html/, "content type html"));
              test.ok(stdout.match(/Hello Couchi!/, "content"));
              return test.done();
            });
          },
          "style/wiki.css": function(test) {
            var cmd;
            cmd = "curl -i localhost:5984/" + connPara.db + "/" + docid + "/style/wiki.css";
            return exec(cmd, function(err, stdout, stderr) {
              test.ok(!(err != null), "curl on attachment must succeed ");
              test.ok(stdout.match(/Content-Type: text\/css/, "content type css"));
              test.ok(stdout.match(/background-color: #f8f8f8;/, "content"));
              return test.done();
            });
          }
        },
        "document": function(test) {
          return couch_helper.get_doc(connection, docid, function(err, retdoc) {
            test.ok(!(err != null), "getting the document must not pass an error");
            test.ok(retdoc != null, "getting the document must pass an document");
            test.ok(retdoc.shows.edit === "function(doc, req) {}", ".show.edit must match filecontent");
            test.ok(retdoc.sub.objfile.sumenum === 42, "42 is in doc");
            return test.done();
          });
        }
      },
      "clean": {
        "deleting the database": function(test) {
          test.expect(2);
          return couch_helper.deleteDB(connection, function(err) {
            test.ok(!(err != null), "the delete operation must succeed");
            return couch_helper.getDB(connection, function(err) {
              test.ok(err === 404, "the database must not exist");
              return test.done();
            });
          });
        }
      }
    }
  };
})());