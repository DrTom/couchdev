/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var Helper, println, simplecli;
Helper = require('./helper.js');
simplecli = require('simplecli');
println = simplecli.printer.println;
exports.run = function() {
  var a, b, jsonprettify, nice_json;
  jsonprettify = require('jsonprettify');
  nice_json = jsonprettify.json2prettyjson('{"someObject": {"somekey":"somevalue","boolkey":true},"someArray":["abc",3,1,2,true,false]}');
  println(nice_json.replace(/\n/g, ""));
  a = {
    x: "x",
    d: {
      e: "e",
      h: "h"
    },
    f: "f"
  };
  return b = {
    u: "U",
    d: {
      h: "H"
    },
    f: (function() {})
  };
};