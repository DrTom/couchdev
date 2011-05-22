###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

Helper = require './helper.js'

simplecli = require 'simplecli'
println = simplecli.printer.println


exports.run = () ->


  jsonprettify = require 'jsonprettify'

  nice_json = jsonprettify.json2prettyjson '{"someObject": {"somekey":"somevalue","boolkey":true},"someArray":["abc",3,1,2,true,false]}'

  println nice_json.replace /\n/g,""

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

