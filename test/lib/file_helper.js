/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var file_helper, helpers, mkdeepdir, println, recursiveFileVisitor;
file_helper = require('../../lib/file_helper.js');
helpers = require('drtoms-nodehelpers');
println = helpers.printer.println;
mkdeepdir = file_helper.mkdeepdir;
recursiveFileVisitor = file_helper.recursiveFileVisitor;
exports["file helper"] = {
  "reading a document": function(test) {
    test.expect(3);
    return file_helper.readDocument('test/data/simpleApp.json', function(err, doc) {
      test.ok(!(err != null), "must not pass an error");
      test.ok(doc != null, "must return an non empty document");
      test.ok(typeof doc === "object", "doc must be of object");
      return test.done();
    });
  }
};