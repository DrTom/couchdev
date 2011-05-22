###
Copyright 2011 Thomas Schank
Released under the GNU AFFERO GENERAL PUBLIC LICENSE Version 3
###

path = require 'path'
fs = require 'fs'

mainDir = path.join(path.dirname(fs.realpathSync(__filename)),'../')
libDir = mainDir + "lib/"

exports.couch_helper=  require libDir + 'couch_helper'
exports.connector = require './connector'

helpers = require 'drtoms-nodehelpers'
print = helpers.printer.print
println = helpers.printer.println

bold  = '\033[0;1m'
red   = '\033[0;31m'
purple= '\033[0;35m'
green = '\033[0;32m'
reset = '\033[0m'


helpers = require 'drtoms-nodehelpers'
logging = helpers.logging

if process.env.LOGLEVEL?
  logging.defaultAppenders().forEach (appender)->
    appender.level(process.env.LOGLEVEL)


exports.run = (options) ->

  argv=process.argv
  command = argv[2] # get and remove command argv; opts will fail otherwise
  process.argv = argv.slice(0,2).concat( argv.slice 3 )

  fs = require 'fs'
  path = require 'path'
  lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib')

  showCommands = ->
    println 'try "couchdev command --help", with command any of:'

    println bold+" push"+reset+": push documents to a CouchDB database"
    println bold+" pull"+reset+": pull documents from a CouchDB database"

  switch command
    when "pull" then require('./pull').run()
    when "push" then require(lib+'/push').run()
    when "dochash" then require(lib+'/dochash').run()
    when "tryme" then require(lib+'/tryme').run()
    else showCommands()


