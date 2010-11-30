CoffeeScript = require 'coffee-script'

fh = require '../lib/FileHelper'

doNothing = ->
logFile  = (file) -> console.log file

fh.fileVisitor ".", logFile , doNothing
