/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var bold, fs, green, helpers, libDir, logging, mainDir, path, print, println, purple, red, reset;
path = require('path');
fs = require('fs');
mainDir = path.join(path.dirname(fs.realpathSync(__filename)), '../');
libDir = mainDir + "lib/";
exports.couch_helper = require(libDir + 'couch_helper');
exports.connector = require('./connector');
helpers = require('drtoms-nodehelpers');
print = helpers.printer.print;
println = helpers.printer.println;
bold = '\033[0;1m';
red = '\033[0;31m';
purple = '\033[0;35m';
green = '\033[0;32m';
reset = '\033[0m';
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
if (process.env.LOGLEVEL != null) {
  logging.defaultAppenders().forEach(function(appender) {
    return appender.level(process.env.LOGLEVEL);
  });
}
exports.run = function(options) {
  var argv, command, lib, showCommands;
  argv = process.argv;
  command = argv[2];
  process.argv = argv.slice(0, 2).concat(argv.slice(3));
  fs = require('fs');
  path = require('path');
  lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');
  showCommands = function() {
    println('try "couchdev command --help", with command any of:');
    println(bold + " push" + reset + ": push documents to a CouchDB database");
    return println(bold + " pull" + reset + ": pull documents from a CouchDB database");
  };
  switch (command) {
    case "pull":
      return require('./pull').run();
    case "push":
      return require(lib + '/push').run();
    case "dochash":
      return require(lib + '/dochash').run();
    case "tryme":
      return require(lib + '/tryme').run();
    default:
      return showCommands();
  }
};