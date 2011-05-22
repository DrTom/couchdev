/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var child_process, fs, helpers, logger, logging, verbosity;
fs = require('fs');
child_process = require('child_process');
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('couchdev-pull');
verbosity = 1;
exports.setVerbosity = function(level) {
  return verbosity = level;
};
/*
   readDocument

   reads and parses a JSON document
   continues with the document as an object
*/
exports.readDocument = function(path, cont) {
  return fs.readFile(path, 'utf8', function(err, data) {
    var doc;
    if (err) {
      logger.error("reading file" + path, err);
      return cont(err);
    } else {
      doc = JSON.parse(data);
      return cont(void 0, doc);
    }
  });
};
exports.mkdeepdir = function(dir, cont) {
  return child_process.exec("mkdir -p " + dir, function(err) {
    return cont(err);
  });
};