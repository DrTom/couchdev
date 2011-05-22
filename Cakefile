ChildProcess = require 'child_process'
Sys = require 'sys'
Util   = require 'util'

spawn = ChildProcess.spawn
exec = ChildProcess.exec


spawnWithOutput = (name,options)->
  red   = '\033[0;31m'
  reset = '\033[0m'
  bold  = '\033[1m'
  proc = spawn name, options
  proc.stdout.on 'data', (data) ->
    Util.print name+": "+data
  proc.stderr.on 'data', (data) ->
    Util.print red+name+": "+data+reset
  proc.on 'exit', (code) ->
    console.log('child process exited with code ' + code)
  console.log('spawned child ' + bold + name + " " + options.join(" ") + reset + ' pid: ' + proc.pid)

task 'build', '', () ->

  spawnWithOutput 'coffee', ['--bare','-o','.','-c', 'src/']
 

task 'continuous-build', '', () ->

  spawnWithOutput 'coffee', ['-w','--bare','-o','.','-c', 'src/']


task 'test','run the test suite', () ->

  exec 'nodeunit test/lib/',  (err,stdout,stderr) ->
    Util.print stdout
    Util.print stderr
    

task 'try', '', () ->
  exec "./bin/couchdev dochash -f test/data/simpleApp.json  | awk '{print $2}'", (err,stdout,stderr)->
    Util.print stdout
    Util.print stderr
    

