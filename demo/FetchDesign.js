(function() {
  var args, fetch, fs, http, options, opts, saveData, showData, sys;
  var __hasProp = Object.prototype.hasOwnProperty;
  http = require('http');
  sys = require('sys');
  fs = require('fs');
  args = {
    dir: "./tmp",
    db: undefined,
    desdoc: undefined
  };
  saveData = function(data) {
    var _i, _j, _ref, _result, red, reset, view;
    red = '\033[0;31m';
    reset = '\033[0m';
    try {
      fs.mkdirSync(args.dir, 511);
    } catch (error) {
      console.log(red + error + reset);
    }
    _result = []; _ref = data.views;
    for (_j in _ref) {
      if (!__hasProp.call(_ref, _j)) continue;
      (function() {
        var map, reduce;
        var view = _j;
        var _i = _ref[_j];
        return _result.push((function() {
          try {
            fs.mkdirSync(args.dir + "/" + view, 511);
          } catch (error) {
            console.log(red + error + reset);
          }
          map = data.views[view].map;
          if (typeof map !== "undefined" && map !== null) {
            fs.writeFile(args.dir + '/' + view + '/map.js', map, function(err) {
              if (err) {
                throw err;
              }
              return console.log('saved!');
            });
          }
          return (reduce = data.views[view].reduce);
        })());
      })();
    }
    return _result;
  };
  showData = function(data) {
    var _i, _ref, _result, map, reduce, view;
    console.log(data);
    console.log(data.views);
    _result = []; _ref = data.views;
    for (view in _ref) {
      if (!__hasProp.call(_ref, view)) continue;
      _i = _ref[view];
      _result.push((function() {
        console.log(view);
        map = data.views[view].map;
        reduce = data.views[view].reduce;
        console.log(data.views[view]);
        console.log("MAP: " + map);
        return console.log("REDUCE: " + reduce);
      })());
    }
    return _result;
  };
  fetch = function(db, desdoc) {
    var couchdb, request;
    couchdb = http.createClient(5984, "localhost");
    request = couchdb.request('GET', '/' + db + '/_design/' + desdoc);
    console.log('GET', '/' + db + '/_design/' + desdoc);
    request.on('response', function(response) {
      console.log("############### HTTP Response:");
      console.log("STATUS: " + response.statusCode);
      console.log("HEADERS: " + JSON.stringify(response.headers));
      return response.statusCode === 200 ? response.on('data', function(data) {
        console.log("DATA: " + data);
        sys.inspect(data);
        showData(JSON.parse(data));
        return saveData(JSON.parse(data));
      }) : null;
    });
    return request.end();
  };
  opts = require('opts');
  options = [
    {
      short: 'b',
      long: 'database',
      description: 'name of the database',
      value: true,
      required: true,
      callback: function(value) {
        return (args.db = value);
      }
    }, {
      short: 'd',
      long: 'targetdir',
      description: 'target directory, default: "' + args.dir + '"',
      value: true,
      callback: function(value) {
        return (args.dir = value);
      }
    }, {
      short: 's',
      long: 'designdoc',
      description: 'design doc',
      value: true,
      required: true,
      callback: function(value) {
        return (args.desdoc = value);
      }
    }
  ];
  opts.parse(options, true);
  fetch(args.db, args.desdoc);
}).call(this);
