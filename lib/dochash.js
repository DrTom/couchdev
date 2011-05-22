/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var argparser, connection, connector, couch_helper, docid, file, file_helper, fs, helper, helpers, lib_dir, main_dir, md5_check, path, println, processDocument, setFile;
path = require('path');
fs = require('fs');
main_dir = path.join(path.dirname(fs.realpathSync(__filename)), '../');
lib_dir = main_dir + "lib/";
connector = require(lib_dir + 'connector');
helper = require('./helper');
md5_check = helper.md5_check;
file_helper = require('./file_helper');
file = void 0;
docid = void 0;
couch_helper = require(lib_dir + 'couch_helper');
connection = connector.create();
helpers = require('drtoms-nodehelpers');
argparser = helpers.argparser;
println = helpers.printer.println;
setFile = function(value) {
  connection = void 0;
  return file = value;
};
processDocument = function(err, doc) {
  var md5, pref;
  if (err != null) {
    println("ERR", err);
    process.exit(1);
  }
  md5 = md5_check.docMd5(doc);
  pref = connection != null ? connection.url() + "/" + docid : file;
  return println(pref + " " + md5);
};
exports.run = function() {
  var options;
  options = [
    {
      short: 'f',
      long: 'file',
      description: 'path to CouchDB JSON document',
      value: true,
      callback: setFile
    }, {
      short: 'd',
      long: 'document',
      value: true,
      callback: function(value) {
        return docid = value;
      }
    }
  ].concat(connector.get_options(connection));
  argparser.parse({
    help: true,
    options: options
  });
  if (file != null) {
    return file_helper.readDocument(file, processDocument);
  } else {
    return couch_helper.get_doc(connection, docid, processDocument);
  }
};