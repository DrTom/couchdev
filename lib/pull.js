/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var argparser, base64, child_process, connector, couch_helper, file_helper, fs, helper, helpers, inspect, jsonprettify, lib_dir, logger, logging, main_dir, mkdeepdir, path, println, util, writeDesignDoc, _;
var __hasProp = Object.prototype.hasOwnProperty;
path = require('path');
fs = require('fs');
main_dir = path.join(path.dirname(fs.realpathSync(__filename)), '../');
lib_dir = main_dir + "lib/";
couch_helper = require(lib_dir + 'couch_helper');
file_helper = require(lib_dir + 'file_helper');
helper = require(lib_dir + 'helper');
base64 = require('../vendor/base64');
child_process = require('child_process');
_ = require('underscore');
connector = require(lib_dir + 'connector');
helpers = require('drtoms-nodehelpers');
println = helpers.printer.println;
argparser = helpers.argparser;
mkdeepdir = file_helper.mkdeepdir;
jsonprettify = require('jsonprettify');
util = require('util');
inspect = function() {
  return (util.inspect.apply(this, arguments)).replace(/\n/g, "");
};
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('couchdev-pull');
writeDesignDoc = function(args, cont) {
  var attachment, attachmentDone, doc, docpath, filepath, writeAttachment, writeDesignOuterDone, writeDesignTracker, writeFilesDone, writeManifestFiles, writeObject, writeViewsAndShows, _ref;
  doc = args.doc;
  writeDesignTracker = helpers.asynchelper.createTaskTracker((function(err) {
    return cont(err);
  }), {
    name: "writeDesignTracker-" + doc._id
  });
  writeDesignOuterDone = writeDesignTracker.createTask("writeDesignOuterDone");
  docpath = args.dir + "/" + doc._id;
  writeAttachment = function(targetdir, filepath, attachment, cont) {
    var attachmentPath, filename, total, _ref;
    _ref = (docpath + "/_attachments/" + filepath).match(/(.*\/)(.*)/), total = _ref[0], attachmentPath = _ref[1], filename = _ref[2];
    return file_helper.mkdeepdir(attachmentPath, function(err) {
      if (err != null) {
        return cont(err);
      } else {
        return fs.writeFile(docpath + "/_attachments/" + filepath, base64.decode(attachment.data), function(err) {
          return cont(err);
        });
      }
    });
  };
  _ref = doc._attachments;
  for (filepath in _ref) {
    attachment = _ref[filepath];
    attachmentDone = writeDesignTracker.createTask(filepath + attachment);
    writeAttachment(args.dir, filepath, attachment, attachmentDone);
  }
  delete doc._attachments;
  writeObject = function(params, cont) {
    return file_helper.mkdeepdir(docpath + "/" + params.path, function(err) {
      var object, stringified;
      if (err != null) {
        return cont(err);
      } else {
        object = params.parent[params.object_name];
        delete params.parent[params.object_name];
        logger.debug("writing: " + docpath + "/" + params.file);
        stringified = (function() {
          if (!(object != null)) {
            logger.warn("the to be stringyfied object is undefined for " + docpath + "/" + params.file);
            return "";
          } else if (typeof object === 'string') {
            return object;
          } else {
            try {
              return jsonprettify.json2prettyjson(JSON.stringify(object));
            } catch (error) {
              logger.warn("jsonprettify failed", error);
              return JSON.stringify(object);
            }
          }
        })();
        if (!(stringified != null)) {
          logger.error("stringified still not set");
          stringified = "";
        }
        return fs.writeFile(docpath + "/" + params.file, stringified, function(err) {
          if (err != null) {
            logger.error("writing " + params.file + " failed", err);
          }
          return cont(err);
        });
      }
    });
  };
  writeManifestFiles = function(cont) {
    var mainManifestTaskDone, manifestTaskTracker;
    manifestTaskTracker = helpers.asynchelper.createTaskTracker((function(err) {
      return cont(err);
    }), {
      name: "manifestTaskTracker"
    });
    mainManifestTaskDone = manifestTaskTracker.createTask("main task");
    if (!(doc.couchdev != null)) {
      doc.couchdev = {};
    }
    if (!(doc.couchdev.manifest != null)) {
      doc.couchdev.manifest = [];
    }
    if ((doc.couchdev != null) && (doc.couchdev.manifest != null)) {
      (function() {
        var couchdevDone, manifest;
        couchdevDone = manifestTaskTracker.createTask("couchdev manifest");
        manifest = doc.couchdev.manifest;
        manifest = manifest.concat(args.conf_manifest);
        delete doc.couchdev;
        manifest.forEach(function(file) {
          var dissected, o, objname, objpath, parent, _i, _len;
          dissected = file.match(/(.*)(\.)([^.]+)$/);
          if (dissected != null) {
            objpath = dissected[1].split('/');
          } else {
            objpath = file.split('/');
          }
          objname = objpath.pop();
          parent = doc;
          for (_i = 0, _len = objpath.length; _i < _len; _i++) {
            o = objpath[_i];
            parent = parent[o];
          }
          return writeObject({
            path: objpath.join("/") + "/",
            parent: parent,
            object_name: objname,
            file: file
          }, manifestTaskTracker.createTask(file));
        });
        return couchdevDone();
      })();
    }
    if ((doc.couchapp != null) && (doc.couchapp.manifest != null)) {
      (function() {
        var couchappDone, manifest;
        couchappDone = manifestTaskTracker.createTask("couchapp manifest");
        manifest = doc.couchapp.manifest;
        delete doc.couchapp.manifest;
        manifest.forEach(function(file) {
          var filename, obj_matcher, object_name, parent, path_matcher, whatever, _ref2, _ref3;
          if (!file.match(/^.*\/$/)) {
            path = "";
            object_name = "";
            filename = "";
            if (file.match(/\//)) {
              path_matcher = /^(.*\/)([^\/]+)$/;
              _ref2 = file.match(path_matcher), whatever = _ref2[0], path = _ref2[1], filename = _ref2[2];
            } else {
              filename = file;
            }
            if (filename.match(/\./)) {
              obj_matcher = /^(.*)\.([^\.]+)$/;
              _ref3 = filename.match(obj_matcher), whatever = _ref3[0], object_name = _ref3[1];
            } else {
              object_name = filename;
            }
            parent = helper.lastObjPath(doc, path);
            return writeObject({
              path: path,
              parent: parent,
              object_name: object_name,
              file: file
            }, manifestTaskTracker.createTask(path + "/" + file));
          }
        });
        return couchappDone();
      })();
    }
    return mainManifestTaskDone();
  };
  writeViewsAndShows = function(cont) {
    var fun, funValue, outerDone, shows, viewName, viewValue, views, writeViewsAndShowsTaskTracker, _ref2;
    writeViewsAndShowsTaskTracker = helpers.asynchelper.createTaskTracker((function(err) {
      return cont(err);
    }), {
      name: "writeViewsAndShowsTaskTracker"
    });
    outerDone = writeViewsAndShowsTaskTracker.createTask();
    views = doc.views;
    if (views != null) {
      for (viewName in views) {
        viewValue = views[viewName];
        _ref2 = views[viewName];
        for (fun in _ref2) {
          funValue = _ref2[fun];
          writeObject({
            "path": "views/" + viewName + "/",
            "parent": views[viewName],
            "object_name": fun,
            "file": "views/" + viewName + "/" + fun + ".js"
          }, writeViewsAndShowsTaskTracker.createTask());
        }
      }
    }
    shows = doc.shows;
    if (shows != null) {
      for (fun in shows) {
        if (!__hasProp.call(shows, fun)) continue;
        funValue = shows[fun];
        writeObject({
          "path": "shows/",
          "parent": shows,
          "object_name": fun,
          "file": "shows/" + fun + ".js"
        }, writeViewsAndShowsTaskTracker.createTask());
      }
    }
    return outerDone();
  };
  writeFilesDone = writeDesignTracker.createTask("writeFilesDone");
  writeManifestFiles(function(err) {
    if (err != null) {
      return writeFilesDone(err);
    } else {
      return writeViewsAndShows(function(err) {
        if (err != null) {
          writeFilesDone(err);
        } else {

        }
        delete doc._rev;
        delete doc._id;
        helper.recursiveDeleteEmptyObjects(doc);
        logger.info("WRITING: ", docpath + ".json");
        return file_helper.mkdeepdir(docpath, function(err) {
          if (err != null) {
            return writeFilesDone(err);
          } else {
            return fs.writeFile(docpath + "/_doc.json", jsonprettify.json2prettyjson(JSON.stringify(doc)), function(err) {
              if (err != null) {
                logger.error("wrting " + docpath + ".json failed", err);
              }
              return writeFilesDone(err);
            });
          }
        });
      });
    }
  });
  return writeDesignOuterDone();
};
exports.run = function(argv) {
  var conf_manifest, connection, createTargetDir, filterOutDesignIds, getdocListItems, options, printFailed, processDocs, pull_datadocs, pull_designdocs, targetdir;
  connection = connector.create();
  options = connector.get_options(connection);
  targetdir = "./my_couch_data";
  pull_designdocs = true;
  pull_datadocs = false;
  conf_manifest = [];
  options.push({
    short: 'd',
    long: 'targetdir',
    description: 'target directory, default: "' + targetdir + '"',
    value: true,
    callback: function(value) {
      return targetdir = value;
    }
  });
  options.push({
    long: 'skip-design-docs',
    description: 'do not pull any of the design documents',
    value: false,
    callback: function(value) {
      return pull_designdocs = false;
    }
  });
  options.push({
    long: 'include-data-docs',
    description: 'pull data docs',
    value: false,
    callback: function(value) {
      return pull_datadocs = true;
    }
  });
  options.push({
    long: 'manifest',
    description: 'additional manifest definitions',
    value: true,
    callback: function(value) {
      return conf_manifest = JSON.parse(value);
    }
  });
  argparser.parse({
    help: true,
    options: options,
    argv: argv
  });
  createTargetDir = function(cont) {
    return path.exists(targetdir, function(exists) {
      if (exists) {
        logger.error("target directory exists already");
        return cont(exists);
      } else {
        return child_process.exec("mkdir -p " + targetdir, function(err, stdout, stderr) {
          if (err != null) {
            logger.error("failed to create target directory");
            return cont(err);
          } else {
            return path.exists(targetdir, function(exists) {
              if (exists) {
                return cont();
              } else {
                logger.error("failed to create target directory");
                return cont(exists);
              }
            });
          }
        });
      }
    });
  };
  getdocListItems = function(cont) {
    var reqModifier, resultEmitter;
    reqModifier = function(req) {
      req.uri = req.uri + "/_all_docs";
      return req;
    };
    resultEmitter = function(resp, body, cont) {
      return cont(null, JSON.parse(body).rows);
    };
    return couch_helper.dbOperation(connection, reqModifier, null, resultEmitter, cont);
  };
  filterOutDesignIds = function(dofilter, docListItems, cont) {
    return cont(null, _.select(docListItems, function(doc) {
      return doc.id.match(/_design\/.*/);
    }));
  };
  processDocs = function(docListItems, cont) {
    var docsTracker, downloadDoc, outerDocsTaskDone;
    docsTracker = helpers.asynchelper.createTaskTracker((function(err) {
      return cont(err);
    }), {
      name: "docsTracker"
    });
    outerDocsTaskDone = docsTracker.createTask();
    downloadDoc = function(docListItem, cont) {
      var docid;
      logger.info("getting: " + (inspect(docListItem)));
      docid = docListItem.id;
      return couch_helper.get_doc(connection, docid, function(err, bodyobj) {
        if (err != null) {
          logger.error("getting of doc " + docListItem + " failed with " + err);
          return cont(err);
        } else {
          return cont(null, bodyobj);
        }
      });
    };
    docListItems.forEach(function(docListItem) {
      var doneDoc;
      doneDoc = docsTracker.createTask('doc-' + docListItem.id);
      logger.info("download doc: " + docListItem.id);
      return downloadDoc(docListItem, function(err, doc) {
        if (err != null) {
          doneDoc(err);
          return logger.warn("download doc: " + docListItem.id + " error:" + (inspect(err)));
        } else {
          logger.info("writing doc: " + docListItem.id);
          return writeDesignDoc({
            dir: targetdir,
            conf_manifest: conf_manifest,
            doc: doc
          }, (function(err) {
            return doneDoc(err);
          }));
        }
      });
    });
    return outerDocsTaskDone();
  };
  printFailed = function(err, msg) {
    return println("ERROR", "pull failed :", err, msg);
  };
  return createTargetDir(function(err) {
    if (err != null) {
      printFailed(err, "creating target dir");
      return process.exit(-1);
    } else {
      return getdocListItems(function(err, docListItems) {
        if (err != null) {
          printFailed(err, "getting doc ids");
          return process.exit(-1);
        } else {
          if (!pull_designdocs) {
            docListItems = _.select(docListItems, function(doc) {
              return !doc.id.match(/_design\/.*/);
            });
          }
          if (!pull_datadocs) {
            docListItems = _.select(docListItems, function(doc) {
              return doc.id.match(/_design\/.*/);
            });
          }
          return processDocs(docListItems, function(err) {
            if (err != null) {
              printFailed("handling doc", err);
              return process.exit(-1);
            } else {
              return println("OK", "pull succeeded");
            }
          });
        }
      });
    }
  });
};