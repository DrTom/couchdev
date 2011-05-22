/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var bin_dir, child_process, connector, couch_helper, exec, execEnv, fs, helpers, lib_dir, logger, logging, main_dir, path, spawn;
child_process = require('child_process');
path = require('path');
fs = require('fs');
exec = child_process.exec;
spawn = child_process.spawn;
main_dir = path.join(path.dirname(fs.realpathSync(__filename)), '../../');
lib_dir = main_dir + "lib/";
bin_dir = main_dir + "bin/";
connector = require(lib_dir + "connector");
couch_helper = require(lib_dir + "couch_helper");
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('test');
execEnv = {
  encoding: 'utf8',
  timeout: 0,
  maxBuffer: 200 * 1024,
  killSignal: 'SIGTERM',
  cwd: main_dir,
  env: null
};
exports['dochash test'] = (function() {
  var connPara, connection, testname;
  testname = "couchdev-dochash";
  connPara = {
    db: testname
  };
  if ((process.env['CouchUSER'] != null) && (process.env['CouchPASS'] != null)) {
    connPara['user'] = process.env['CouchUSER'];
    connPara['pass'] = process.env['CouchPASS'];
  }
  connection = connector.create(connPara);
  return {
    "executeable filetest": function(test) {
      return exec("./bin/couchdev dochash -f ./test/data/dochash.json  | awk '{print $2}'", execEnv, function(err, stdout, sterr) {
        var md5;
        test.expect(2);
        test.ok(!(err != null), 'error must be null');
        md5 = stdout.replace(/\n/, "");
        test.equal(md5, '11f3df84eb955383ce00867400fa782c', "the hash for the file must be correct");
        return test.done();
      });
    },
    "executeable database test": {
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
        },
        "putting the document": function(test) {
          var cmd;
          cmd = "curl -X PUT localhost:5984/" + testname + "/test -d @test/data/dochash.json ";
          return exec(cmd, execEnv, function(err, stdout, sterr) {
            test.expect(1);
            test.ok(!(err != null), 'error must be null');
            return test.done();
          });
        }
      },
      "confirm": {
        "hashing the document": function(test) {
          return exec("couchdev dochash  -b " + testname + " -d test | awk '{print $2}'", execEnv, function(err, stdout, sterr) {
            var md5;
            test.expect(2);
            test.ok(!(err != null), 'error must be null');
            md5 = stdout.replace(/\n/, "");
            test.equal(md5, '11f3df84eb955383ce00867400fa782c', "the hash for the file must be correct");
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
})();