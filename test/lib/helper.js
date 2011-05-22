/*
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
*/var helper, helpers, println, testCase;
helper = require('../../lib/helper.js');
helpers = require('drtoms-nodehelpers');
println = helpers.printer.println;
testCase = require('nodeunit').testCase;
module.exports = testCase((function() {
  return {
    "delete subobjects": {
      "simple flat test": function(test) {
        var a;
        a = {
          b: {}
        };
        test.ok(a.b != null, "a has an (empty) b subobject");
        helper.recursiveDeleteEmptyObjects(a);
        test.ok(!(a.b != null), "a has an (empty) b subobject");
        return test.done();
      },
      "simple deep test": function(test) {
        var a;
        a = {
          b: {
            c: {}
          }
        };
        test.ok(a.b != null, "a has an (empty) b subobject");
        helper.recursiveDeleteEmptyObjects(a);
        test.ok(!(a.b != null), "a has an (empty) b subobject");
        return test.done();
      }
    },
    "deep test with empty and non empty subobject": function(test) {
      var a;
      a = {
        b1: {
          c: {}
        },
        b2: "bla",
        b3: {}
      };
      test.ok(a.b1 != null, "a has an b1 subobject");
      test.ok(a.b2 != null, "a has an b2 subobject");
      test.ok(a.b3 != null, "a has an b3 subobject");
      helper.recursiveDeleteEmptyObjects(a);
      test.ok(!(a.b1 != null), "a has not an (empty) b1 subobject");
      test.ok(!(a.b3 != null), "a has not an (empty) b3 subobject");
      test.ok(a.b2 != null, "a has an  b2 subobject");
      return test.done();
    },
    "recursiveMerge": function(test) {
      var a, b, c;
      a = {
        x: "x",
        d: {
          e: "e",
          h: "h"
        },
        f: "f"
      };
      b = {
        u: "U",
        d: {
          h: "H"
        },
        f: (function() {})
      };
      c = {};
      helper.recursiveMerge(c, a);
      test.deepEqual(c, a, "deep equal");
      helper.recursiveMerge(a, b);
      test.ok(a.x === 'x', "presever object");
      test.ok(a.d.e === 'e', "preserve deep object");
      test.ok(a.d.h === 'H', "overwrite deep from second object");
      test.ok(typeof a.f === 'function', "include function");
      return test.done();
    }
  };
})());