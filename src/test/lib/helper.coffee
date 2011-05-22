###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###
  

helper = require '../../lib/helper.js'

helpers = require 'drtoms-nodehelpers'
println = helpers.printer.println

testCase = require('nodeunit').testCase

module.exports = testCase((()->


  "delete subobjects":
    
    "simple flat test": (test) ->

      a = {
        b : {
          }
        }

      test.ok a.b?, "a has an (empty) b subobject"

      helper.recursiveDeleteEmptyObjects a
      test.ok not a.b?, "a has an (empty) b subobject"

      test.done()


    "simple deep test": (test) ->
      a = {
        b : {
          c : {
          }
          }
        }

      test.ok a.b?, "a has an (empty) b subobject"

      helper.recursiveDeleteEmptyObjects a
      test.ok not a.b?, "a has an (empty) b subobject"

      test.done()

   "deep test with empty and non empty subobject": (test) ->

     a={b1 : { c : { } }
       ,b2 : "bla"
       ,b3 : { }
      }

     test.ok a.b1?, "a has an b1 subobject"
     test.ok a.b2?, "a has an b2 subobject"
     test.ok a.b3?, "a has an b3 subobject"

     helper.recursiveDeleteEmptyObjects a
     test.ok not a.b1?, "a has not an (empty) b1 subobject"
     test.ok not a.b3?, "a has not an (empty) b3 subobject"
     test.ok a.b2?, "a has an  b2 subobject"

     test.done()

  "recursiveMerge": (test)->

    a =
      { x: "x"
      , d:
        { e: "e"
        , h: "h"
        }
      , f: "f"
      }

    b =
      { u: "U"
      , d:
        { h: "H"
        }
      , f: (()->)
      }

    c = {}

    
    helper.recursiveMerge c,a
      
    test.deepEqual c,a,"deep equal"

    helper.recursiveMerge a,b

    test.ok a.x is 'x' , "presever object"
    test.ok a.d.e is 'e', "preserve deep object"
    test.ok a.d.h is 'H', "overwrite deep from second object"
    test.ok typeof a.f is 'function', "include function"

    test.done()

)())

