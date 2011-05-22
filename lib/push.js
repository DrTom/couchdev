/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var argparser, base64, connector, couch_helper, file_helper, fs, helper, helpers, lib_dir, logger, logging, main_dir, mimetypes, path, println, recursiveFileWalker;
path = require('path');
fs = require('fs');
main_dir = path.join(path.dirname(fs.realpathSync(__filename)), '../');
lib_dir = main_dir + "lib/";
helper = require(lib_dir + 'helper');
couch_helper = require(lib_dir + 'couch_helper');
file_helper = require(lib_dir + 'file_helper');
base64 = require(main_dir + 'vendor/base64');
connector = require(lib_dir + 'connector');
helpers = require('drtoms-nodehelpers');
println = helpers.printer.println;
argparser = helpers.argparser;
recursiveFileWalker = helpers.filehelper.recursiveFileWalker;
mimetypes = (require(lib_dir + "mimetypes")).mimetypes;
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('couchdev-push');
exports.run = function(argv) {
  var connection, count_pushed_data_docs, count_pushed_design_docs, options, push_datadocs, push_designdocs, putDoc, readDocument, sourcedir, start;
  connection = connector.create();
  options = connector.get_options(connection);
  sourcedir = process.cwd();
  count_pushed_design_docs = 0;
  count_pushed_data_docs = 0;
  push_designdocs = true;
  push_datadocs = false;
  options.push({
    short: 'd',
    long: 'sourcedir',
    description: 'source directory, default: "' + sourcedir + '"',
    value: true,
    callback: function(value) {
      return sourcedir = fs.realpathSync(value);
    }
  });
  options.push({
    long: 'skip-design-docs',
    description: 'do not push any of the design documents',
    value: false,
    callback: function(value) {
      return push_designdocs = false;
    }
  });
  options.push({
    long: 'include-data-docs',
    description: 'push data docs',
    value: false,
    callback: function(value) {
      return push_datadocs = true;
    }
  });
  argparser.parse({
    help: true,
    options: options,
    argv: argv
  });
  logger.debug("connection.url: ", connection.url());
  logger.trace("connection: ", connection);
  readDocument = function(path, cont) {
    var doc, fileHandler, integrateJsonDone, outerTaskDone, tasktracker, walkFilesDone;
    doc = {
      couchdev: {
        pushed_at: (new Date()).toISOString(),
        manifest: []
      }
    };
    tasktracker = helpers.asynchelper.createTaskTracker((function(err) {
      return cont(err, doc);
    }));
    outerTaskDone = tasktracker.createTask("read " + path);
    integrateJsonDone = tasktracker.createTask("read" + path + "/_doc.json");
    file_helper.readDocument(path + "/_doc.json", function(err, data) {
      if (err != null) {
        return integrateJsonDone({
          "task": "integrate json failed",
          "err": err
        });
      } else {
        helper.recursiveMerge(doc, data);
        return integrateJsonDone();
      }
    });
    fileHandler = function(fullfilename, stat, fileDone) {
      var filename, filename_dissected, filename_endig, filename_prefix, obj, relativeObjPath, relativePath, relativePath_dissected, rootObj;
      logger.debug("filehandler " + fullfilename);
      filename = (fullfilename.match(/[^\/]+$/))[0];
      relativePath = fullfilename.replace(path, "");
      relativePath_dissected = relativePath.match(/(.*)(\.)([^\.]+$)/);
      relativeObjPath = relativePath_dissected != null ? relativePath_dissected[1] : relativePath;
      filename_dissected = filename.match(/(.*)(\.)([^\.]+$)/);
      filename_prefix = filename_dissected != null ? filename_dissected[1] : filename;
      filename_endig = filename_dissected != null ? filename_dissected[3] : "";
      logger.trace("filename: ", filename);
      logger.trace("relativePath: ", relativePath);
      logger.trace("relativePath_dissected: ", relativePath_dissected);
      if (!stat.isFile()) {
        return fileDone();
      } else if (filename.match(/^\./)) {
        return fileDone();
      } else if (relativePath.match(/^\/_doc.json/)) {
        return fileDone();
      } else {
        logger.debug("integrating " + fullfilename);
        rootObj = {};
        obj = rootObj;
        return fs.readFile(fullfilename, 'utf8', function(err, data) {
          var attachmentname, i, objpath, objpathLast, _i, _len;
          if (err != null) {
            return fileDone({
              "read file faile": "fullfilename",
              "err": err
            });
          } else {
            if (relativePath.match(/^\/_attachments/)) {
              obj["_attachments"] = {};
              obj = obj["_attachments"];
              attachmentname = (relativePath.match(/(^\/_attachments\/)(.*)/))[2];
              obj[attachmentname] = {};
              obj = obj[attachmentname];
              obj['data'] = base64.encode(data);
              obj['content_type'] = mimetypes[filename_endig];
            } else {
              objpath = (relativeObjPath.split('/')).slice(1);
              doc.couchdev.manifest.push(relativePath.replace(/^\//, ""));
              objpathLast = objpath.pop();
              for (_i = 0, _len = objpath.length; _i < _len; _i++) {
                i = objpath[_i];
                obj[i] = {};
                obj = obj[i];
              }
              obj[objpathLast] = (function() {
                if (filename_endig === "json") {
                  try {
                    return JSON.parse(data);
                  } catch (error) {
                    return data;
                  }
                } else {
                  return data;
                }
              })();
            }
            helper.recursiveMerge(doc, rootObj);
            return fileDone();
          }
        });
      }
    };
    walkFilesDone = tasktracker.createTask(path);
    recursiveFileWalker(path, fileHandler, function(err) {
      return walkFilesDone(err);
    });
    return outerTaskDone();
  };
  putDoc = function(docid, doc, cont) {
    return couch_helper.put_doc(connection, docid, doc, function(err) {
      if (err != null) {
        return cont([
          "putDoc failed", {
            "err": err
          }
        ]);
      } else {
        return cont();
      }
    });
  };
  start = function(cont) {
    var filetracker, outerDone, push_dir;
    logger.debug("SOURCEDIR: ", sourcedir);
    filetracker = helpers.asynchelper.createTaskTracker((function(err) {
      return cont(err);
    }));
    outerDone = filetracker.createTask("outer");
    push_dir = function(dir) {
      var fulldir, readdir_done;
      logger.debug("push_dir:", dir);
      fulldir = sourcedir + "/" + dir;
      logger.debug("fulldir: ", fulldir);
      readdir_done = filetracker.createTask(dir);
      return fs.readdir(fulldir, function(err, files) {
        if (err != null) {
          logger.warn("failed to read '" + dir + "'");
        } else {
          files.forEach(function(filename) {
            var filedone, fullpath;
            if (!filename.match(/^_/)) {
              fullpath = fulldir + "/" + filename;
              filedone = filetracker.createTask(fullpath);
              return fs.stat(fullpath, function(err, stat) {
                var docname;
                if (err != null) {
                  return filedone(err);
                } else {
                  if (stat.isDirectory()) {
                    docname = dir + "/" + (fullpath.match(/\/([^\/]*)$/))[1];
                    logger.debug("docname: ", docname);
                    return readDocument(fullpath, function(err, doc) {
                      if (err != null) {
                        return filedone({
                          "readDocument": "failed for " + fullpath,
                          "err": err
                        });
                      } else {
                        return putDoc(docname, doc, function(err) {
                          if (!(err != null)) {
                            if (docname.match(/^[\/]*_design/)) {
                              count_pushed_design_docs += 1;
                            } else {
                              count_pushed_data_docs += 1;
                            }
                          }
                          return filedone(err);
                        });
                      }
                    });
                  } else {
                    return filedone();
                  }
                }
              });
            }
          });
        }
        return readdir_done();
      });
    };
    if (push_datadocs) {
      push_dir("");
    }
    if (push_designdocs) {
      push_dir("/_design");
    }
    return outerDone();
  };
  return start(function(err) {
    if (err != null) {
      return logger.error("couchdev push failed with ", err);
    } else {
      logger.info("push done");
      return println("couchdev pushed " + count_pushed_design_docs + " design, and " + count_pushed_data_docs + " data document(s)");
    }
  });
};