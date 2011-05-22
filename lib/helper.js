/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var crypto, fs, lastObjPath, md5_check, recursiveDeleteEmptyObjects, recursiveMerge, _;
_ = require('underscore');
crypto = require('crypto');
fs = require('fs');
exports.getEnvVar = function(name) {
  return process.env[name];
};
exports.readDocument = function(path, cont) {
  return fs.readFile(path, 'utf8', function(err, data) {
    var doc;
    if (err) {
      println("ERR", "reading file" + path, err);
      return cont(err);
    } else {
      doc = JSON.parse(data);
      return cont(void 0, doc);
    }
  });
};
md5_check = function() {
  var _cleanCouchdoc, _docMd5, _docsEqual, _md5;
  _cleanCouchdoc = function(_doc) {
    var att, doc, name, _ref;
    doc = _.clone(_doc);
    delete doc._id;
    delete doc._rev;
    _ref = doc._attachments;
    for (name in _ref) {
      att = _ref[name];
      delete att.revpos;
    }
    if (doc.couchapp != null) {
      delete doc.couchapp.manifest;
      delete doc.couchapp.signatures;
    }
    return doc;
  };
  _md5 = function(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  };
  _docMd5 = function(doc) {
    return _md5(JSON.stringify(_cleanCouchdoc(doc)));
  };
  _docsEqual = function(doc1, doc2) {
    return _docMd5(doc1) === _docMd5(doc2);
  };
  return {
    cleanCouchdoc: _cleanCouchdoc,
    docsEqual: _docsEqual,
    docMd5: _docMd5
  };
};
exports.md5_check = md5_check();
lastObjPath = function(obj, path) {
  var next, remainder;
  if (path === "") {
    return obj;
  } else {
    next = path.match(/[^\/]*/)[0];
    remainder = path.replace(/[^\/]*\//, "");
    if (!(obj[next] != null)) {
      obj[next] = {};
    }
    return lastObjPath(obj[next], remainder);
  }
};
exports.lastObjPath = lastObjPath;
recursiveDeleteEmptyObjects = function(obj) {
  var hasSubobjects, key, value, _results;
  hasSubobjects = function(obj) {
    var key, sub, value;
    if (typeof obj !== 'object') {
      return true;
    } else {
      sub = (function() {
        var _results;
        _results = [];
        for (key in obj) {
          value = obj[key];
          _results.push(key);
        }
        return _results;
      })();
      if (sub.length === 0) {
        return false;
      } else {
        return true;
      }
    }
  };
  if ('object' !== typeof obj) {
    ;
  } else {
    for (key in obj) {
      value = obj[key];
      recursiveDeleteEmptyObjects(value);
    }
    _results = [];
    for (key in obj) {
      value = obj[key];
      _results.push(!hasSubobjects(value) ? delete obj[key] : void 0);
    }
    return _results;
  }
};
exports.recursiveDeleteEmptyObjects = recursiveDeleteEmptyObjects;
recursiveMerge = function(o1, o2) {
  var k, v;
  if (typeof o1 !== 'object' || typeof o2 !== 'object') {
    throw 'can only merge objects';
  } else {
    for (k in o2) {
      v = o2[k];
      if ((o1[k] != null) && typeof o1[k] === 'object' && typeof v === 'object') {
        recursiveMerge(o1[k], o2[k]);
      } else {
        o1[k] = v;
      }
    }
  }
  return o1;
};
exports.recursiveMerge = recursiveMerge;