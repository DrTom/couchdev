/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var connector, couch_helper, fs, libDir, mainDir, path, testCase;
path = require('path');
fs = require('fs');
mainDir = path.join(path.dirname(fs.realpathSync(__filename)), '../../');
libDir = mainDir + "lib/";
testCase = require('nodeunit').testCase;
connector = require(libDir + "connector");
couch_helper = require(libDir + "couch_helper");
module.exports = testCase((function() {
  var conn_para, connection, doc, docid;
  conn_para = {
    db: "couchdev-test_crud"
  };
  if ((process.env['CouchUSER'] != null) && (process.env['CouchPASS'] != null)) {
    conn_para['user'] = process.env['CouchUSER'];
    conn_para['pass'] = process.env['CouchPASS'];
  }
  connection = connector.create(conn_para);
  docid = "testdoc";
  doc = {
    name: "Joe"
  };
  return {
    "couch_helper": {
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
          test.ok(!(err != null), "the delete operation must succeed");
          return couch_helper.getDB(connection, function(err) {
            test.ok(!(err != null), "get must succeed");
            return test.done();
          });
        });
      },
      "getting the revision of an not existing document": function(test) {
        test.expect(2);
        return couch_helper.get_revision(connection, docid, function(err, rev) {
          test.ok(!(err != null), "no error must be returned");
          test.ok(rev === null, "revision must be null");
          return test.done();
        });
      },
      "uploading (putting) a document": function(test) {
        test.expect(4);
        return couch_helper.put_doc(connection, docid, doc, function(err, statusCode) {
          test.ok(!(err != null), "must not pass an error");
          test.ok(statusCode === 201, "must create a resource, i.e. return code 201");
          return couch_helper.get_revision(connection, docid, function(err, revision) {
            test.ok(!(err != null), "no error must be returned");
            test.ok(revision !== null, "document must have a revision after creation");
            return test.done();
          });
        });
      },
      "getting and updating the document": function(test) {
        test.expect(6);
        return couch_helper.get_doc(connection, docid, function(err, retdoc) {
          test.ok(!(err != null), "getting the document must not pass an error");
          test.ok(retdoc != null, "getting the document must pass an document");
          delete retdoc._rev;
          delete retdoc._id;
          test.deepEqual(retdoc, doc);
          retdoc.age = 21;
          return couch_helper.put_doc(connection, docid, retdoc, function(err) {
            test.ok(!(err != null), "updating the document must not pass an error");
            return couch_helper.get_doc(connection, docid, function(err, updatedDoc) {
              test.ok(!(err != null), "getting the updated document must not pass an error");
              test.ok(updatedDoc.age === 21, "the updated doc must have the added property");
              return test.done();
            });
          });
        });
      },
      "deleting the document": function(test) {
        test.expect(4);
        return couch_helper.delete_doc(connection, docid, function(err, code) {
          test.ok(!(err != null), "deleting the document must not pass an error");
          test.ok(code === 200, "and the status code must be 200");
          return couch_helper.delete_doc(connection, docid, function(err, code) {
            test.ok(!(err != null), "deleting the document again must not pass an error");
            test.ok(code === 404, "howver the status code must be 404");
            return test.done();
          });
        });
      },
      "finally deleting the database": function(test) {
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
  };
})());