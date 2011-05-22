var BINDIR, CONNECTION, CouchHelper, FS, FileHelper, Helper, LIBDIR, MAINDIR, PATH, SIMPLECLI, TESTDIR, TESTTMPDIR, exec, println, pull, testCase;
PATH = require('path');
FS = require('fs');
MAINDIR = PATH.join(PATH.dirname(FS.realpathSync(__filename)), '../../');
LIBDIR = MAINDIR + "lib/";
BINDIR = MAINDIR + "bin/";
TESTDIR = MAINDIR + "test/";
TESTTMPDIR = TESTDIR + "tmp/";
testCase = require('nodeunit').testCase;
SIMPLECLI = require('simplecli');
println = SIMPLECLI.printer.println;
exec = require('child_process').exec;
CONNECTION = require(LIBDIR + "connection");
Helper = require(LIBDIR + "helper");
CouchHelper = require(LIBDIR + "couchHelper");
FileHelper = require(LIBDIR + "file_helper");
pull = require(LIBDIR + "pull");
module.exports = testCase((function() {
  var connPara, connParaCouchapp, connection, couchapp_connection, couchapp_connection_doc, docConnection;
  connPara = {
    db: "test-couchdev-pull-couchappsample"
  };
  if ((process.env['CouchUSER'] != null) && (process.env['CouchPASS'] != null)) {
    connPara['user'] = process.env['CouchUSER'];
    connPara['pass'] = process.env['CouchPASS'];
  }
  connection = CONNECTION.createConnection(connPara);
  connPara.doc = "_design/couchappsample";
  docConnection = CONNECTION.createConnection(connPara);
  docConnection.requireDoc();
  connParaCouchapp = {
    db: "test-couchdev-pull-couchapppush"
  };
  couchapp_connection = CONNECTION.createConnection(connParaCouchapp);
  connParaCouchapp.doc = "_design/couchappsample";
  couchapp_connection_doc = CONNECTION.createConnection(connParaCouchapp);
  return {
    "prepare putting the document": {
      "deleting the database": function(test) {
        test.expect(2);
        return CouchHelper.deleteDB(connection, function(err) {
          test.ok(!(err != null), "the delete operation must succeed");
          return CouchHelper.getDB(connection, function(err) {
            test.ok(err === 404, "the database must not exist");
            return test.done();
          });
        });
      },
      "creating the database": function(test) {
        test.expect(2);
        return CouchHelper.putDB(connection, function(err) {
          test.ok(!(err != null), "the delete operation must succeed");
          return CouchHelper.getDB(connection, function(err) {
            test.ok(!(err != null), "get must succeed");
            return test.done();
          });
        });
      },
      "uploading (putting) a document": function(test) {
        test.expect(7);
        return FileHelper.readDocument('test/data/couchappsample.json', function(err, doc) {
          test.ok(!(err != null), "reading must not pass an error");
          test.ok(doc != null, "reading must return an non empty document");
          test.ok(typeof doc === "object", "doc must be of object");
          return CouchHelper.putDoc(docConnection, doc, function(err, statusCode) {
            if (err != null) {
              println(err);
            }
            test.ok(!(err != null), "putting must not pass an error");
            test.ok(statusCode === 201, "putting must create a resource, i.e. return code 201");
            return CouchHelper.getRevision(docConnection, function(err, revision) {
              test.ok(!(err != null), "no error must be returned");
              test.ok(revision !== null, "document must have a revision after creation");
              return test.done();
            });
          });
        });
      }
    },
    "couchapp and our PUT equivalence": function(test) {
      return exec("which couchapp", function(err) {
        if (err != null) {
          println("WARN: python couchapp executable not found; will not perform equivalence test;");
          return test.done();
        } else {
          test.expect(5);
          return CouchHelper.deleteDB(couchapp_connection, function(err) {
            test.ok(!(err != null), "the delete operation must succeed");
            return CouchHelper.getDB(couchapp_connection, function(err) {
              var execEnv;
              test.ok(err === 404, "the database must not exist");
              execEnv = {
                encoding: 'utf8',
                timeout: 0,
                maxBuffer: 200 * 1024,
                killSignal: 'SIGTERM',
                cwd: MAINDIR + "test/data/couchappsample",
                env: null
              };
              return exec("couchapp push", execEnv, function(err, stdout, stderr) {
                if (err != null) {
                  return println("WARN: failed to push with couchapp; it will fail if couchDB has no admin-party");
                } else {
                  return CouchHelper.getDoc(docConnection, function(err, ourdoc) {
                    test.ok(!(err != null), "getting the by us pushed document must not pass an error");
                    return CouchHelper.getDoc(couchapp_connection_doc, function(err, couchappdoc) {
                      test.ok(!(err != null), "getting the couchapp pushed document must not pass an error");
                      test.ok(Helper.Md5Check.docsEqual(ourdoc, couchappdoc), "the docs must be equivalent");
                      return test.done();
                    });
                  });
                }
              });
            });
          });
        }
      });
    },
    "pulling the couchapp sample": function(test) {
      var targetdir;
      targetdir = TESTTMPDIR + connParaCouchapp.db;
      return exec("rm -rf " + targetdir, function(err, stdout, stderr) {
        var cmd;
        test.ok(!(err != null), "deleting targetdir must have succeeded");
        cmd = "couchdev pull --database " + connParaCouchapp.db + " --targetdir " + targetdir;
        return exec(cmd, function(err, stdout, stderr) {
          test.ok(!(err != null), "pulltargetdir must have succeeded, command: " + cmd);
          return test.done();
        });
      });
    },
    "diffs to the couchapp sample": function(test) {
      var ODIR, PDIR;
      ODIR = MAINDIR + "test/data/couchappsample/";
      PDIR = MAINDIR + "test/tmp/test-couchdev-pull-couchapppush/DB/_design/couchappsample/";
      return exec("diff --recursive --brief " + ODIR + "views " + PDIR + "views", function(err, stdout, stderr) {
        var cmd;
        test.ok(!(err != null), "diff on views should have succeeded");
        test.ok(!stdout.match(/\w/, "no diff on views "));
        cmd = "diff -B -w --recursive --brief " + ODIR + "vendor/couchapp/lib " + PDIR + "vendor/couchapp/lib";
        return exec(cmd, function(err, stdout, stderr) {
          test.ok(!(err != null), "diff on vendor/lib should have succeeded");
          test.ok(!stdout.match(/\w/, "no diff on vendor/lib"));
          return test.done();
        });
      });
    }
  };
})());