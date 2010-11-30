(function() {
  var fileVisitor;
  fileVisitor = function(startDir, fileHandler, callback) {
    var intFileHandler, recurseDir;
    intFileHandler = function(file, cont) {
      fileHandler(file);
      if (typeof cont !== "undefined" && cont !== null) {
        return cont();
      }
    };
    recurseDir = function(path, cont) {
      var done, fs, pending;
      pending = 0;
      done = function() {
        pending -= 1;
        if (pending === 0) {
          if (typeof cont !== "undefined" && cont !== null) {
            return cont();
          }
        }
      };
      fs = require('fs');
      return fs.readdir(path, function(err, files) {
        var _i, _len, _ref, _result, pos;
        if (typeof err !== "undefined" && err !== null) {
          return console.log(err);
        } else {
          pending = files.length;
          _result = []; _ref = files;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            (function() {
              var pos = _i;
              var file = _ref[_i];
              return _result.push(fs.stat(path + "/" + file, function(err, stats) {
                if (typeof err !== "undefined" && err !== null) {
                  pending -= 1;
                  return console.log(err);
                } else {
                  if (stats.isDirectory()) {
                    recurseDir(path + "/" + file, done);
                  }
                  return stats.isFile() ? intFileHandler(path + "/" + file, done) : null;
                }
              }));
            })();
          }
          return _result;
        }
      });
    };
    return recurseDir(startDir, function() {
      return callback();
    });
  };
  exports.fileVisitor = fileVisitor;
}).call(this);
