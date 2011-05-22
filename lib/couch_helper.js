/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var dbOperation, doc_operation, get_revision, helpers, logger, logging, request;
request = require('request');
helpers = require('drtoms-nodehelpers');
logging = helpers.logging;
logger = logging.logger('couchdev-couch_helper');
if (process.env.LOGLEVEL != null) {
  logging.defaultAppenders().forEach(function(appender) {
    return appender.level(process.env.LOGLEVEL);
  });
}
dbOperation = function(conn, verbOrReqModifier, acceptStatusCode, resultEmitter, cont) {
  var args, req;
  logger.trace("call dbOperation with arguments:", arguments);
  args = Array.prototype.slice.call(arguments);
  cont = args.pop();
  conn = args[0], verbOrReqModifier = args[1], acceptStatusCode = args[2], resultEmitter = args[3];
  req = {
    uri: conn.url(),
    method: 'GET'
  };
  if ((typeof verbOrReqModifier) === 'function') {
    req = verbOrReqModifier(req);
  } else if ((typeof verbOrReqModifier) === 'string') {
    req.method = verbOrReqModifier;
  }
  acceptStatusCode = acceptStatusCode != null ? acceptStatusCode : function(code) {
    return code === 200;
  };
    if (resultEmitter != null) {
    resultEmitter;
  } else {
    resultEmitter = function(resp, body, cont) {
      return cont(null, resp.statusCode);
    };
  };
  return request(req, function(err, resp, body) {
    if (err != null) {
      logger.warn("request returned with error: ", err);
      if (cont != null) {
        return cont(err);
      }
    } else {
      if (acceptStatusCode(resp.statusCode)) {
        return resultEmitter(resp, body, cont);
      } else {
        return cont(resp.statusCode, {
          statusCode: resp.statusCode,
          body: body
        });
      }
    }
  });
};
exports.dbOperation = dbOperation;
exports.getDB = function(conn, cont) {
  return dbOperation(conn, cont);
};
exports.putDB = function(conn, cont) {
  var acceptStatusCode;
  acceptStatusCode = function(code) {
    return code === 200 || code === 201;
  };
  return dbOperation(conn, "PUT", acceptStatusCode, cont);
};
exports.deleteDB = function(conn, cont) {
  var acceptStatusCode;
  acceptStatusCode = function(code) {
    return code === 200 || code === 404;
  };
  return dbOperation(conn, "DELETE", acceptStatusCode, cont);
};
doc_operation = function(url, verbOrReqModifier, acceptStatusCode, resultEmitter, cont) {
  var args, req;
  logger.trace("call doc_operation with arguments:", arguments);
  args = Array.prototype.slice.call(arguments);
  cont = args.pop();
  url = args[0], verbOrReqModifier = args[1], acceptStatusCode = args[2], resultEmitter = args[3];
    if (acceptStatusCode != null) {
    acceptStatusCode;
  } else {
    acceptStatusCode = function(code) {
      return code === 200;
    };
  };
    if (resultEmitter != null) {
    resultEmitter;
  } else {
    resultEmitter = function(resp, body, cont) {
      return cont(null, body);
    };
  };
  req = {
    uri: url
  };
  if ((typeof verbOrReqModifier) === 'function') {
    req = verbOrReqModifier(req);
  }
  if ((typeof verbOrReqModifier) === 'string') {
    req.verb = verbOrReqModifier;
  }
  return request(req, function(err, resp, body) {
    if (err != null) {
      logger.warn("request returned with error: ", err);
      if (cont != null) {
        return cont({
          "doc_operation": "failed",
          "err": err
        });
      }
    } else {
      logger.info("resp.statusCode: " + resp.statusCode);
      logger.trace("body: ", body);
      if (acceptStatusCode(resp.statusCode)) {
        return resultEmitter(resp, body, cont);
      } else {
        logger.warn("status code " + resp.statusCode + " not accepted");
        logger.debug("RESPONSE: ", resp.toString());
        return cont([
          "doc_operation failed with statusCode " + resp.statusCode, {
            "body": body
          }
        ]);
      }
    }
  });
};
exports.doc_operation = doc_operation;
get_revision = function(conn, docid, cont) {
  var acceptStatusCode, resultEmitter;
  logger.trace("call get_revision with arguments:", arguments);
  acceptStatusCode = function(code) {
    return code === 200 || code === 404;
  };
  resultEmitter = function(resp, body, cont) {
    if (resp.statusCode === 200) {
      return cont(void 0, (JSON.parse(body))._rev);
    } else if (resp.statusCode === 404) {
      return cont(void 0, null);
    }
  };
  return doc_operation(conn.url({
    docid: docid
  }), "GET", acceptStatusCode, resultEmitter, cont);
};
exports.get_revision = get_revision;
exports.get_doc = function(conn, docid, cont) {
  var acceptStatusCode, resultOperator;
  logger.trace("call get_doc with arguments:", arguments);
  acceptStatusCode = function(code) {
    return code === 200;
  };
  resultOperator = function(resp, body, cont) {
    return cont(null, JSON.parse(body));
  };
  return doc_operation(conn.url({
    docid: docid,
    attachments: true
  }), "GET", acceptStatusCode, resultOperator, cont);
};
exports.put_doc = function(conn, docid, doc, cont) {
  logger.trace("call put_doc with arguments:", arguments);
  return get_revision(conn, docid, function(err, rev) {
    var acceptStatusCode, reqModifier, resultOperator;
    if (err != null) {
      logger.warn(err);
      return cont({
        "put_doc": "failed get_revision",
        "err": err
      });
    } else {
      if (rev != null) {
        doc._rev = rev;
      }
      acceptStatusCode = function(code) {
        return code === 201;
      };
      reqModifier = function(req) {
        return req = {
          headers: {
            'content-type': 'application/json',
            'accept-type': 'application/json'
          },
          uri: conn.url({
            docid: docid
          }),
          body: JSON.stringify(doc),
          method: 'PUT'
        };
      };
      resultOperator = function(resp, body, cont) {
        return cont(null, resp.statusCode);
      };
      return doc_operation(null, reqModifier, acceptStatusCode, resultOperator, cont);
    }
  });
};
exports.delete_doc = function(conn, docid, cont) {
  logger.trace("call delete_doc with arguments:", arguments);
  return get_revision(conn, docid, function(err, rev) {
    var acceptStatusCode, reqModifier, resultOperator;
    if (err) {
      logger.warn(err);
      return cont(err);
    } else {
      acceptStatusCode = function(code) {
        return code === 200 || code === 404;
      };
      reqModifier = function(req) {
        return req = {
          uri: (conn.url({
            docid: docid
          })) + "?rev=" + rev,
          method: 'DELETE'
        };
      };
      resultOperator = function(resp, body, cont) {
        return cont(null, resp.statusCode);
      };
      return doc_operation(null, reqModifier, acceptStatusCode, resultOperator, cont);
    }
  });
};