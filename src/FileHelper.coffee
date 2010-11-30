# executes 'fileHandler' on each file bellow 'startDir'
# executes 'callback' after all files are processed 
# 
fileVisitor = (startDir,fileHandler,callback) ->

  intFileHandler = (file, cont) ->
    fileHandler file
    cont() if cont?

  recurseDir = (path,cont) ->

    pending=0

    done = ->
      pending -= 1
      if pending is 0
        cont() if cont?

    fs = require 'fs'
    fs.readdir path, (err,files) ->
      if err?
        console.log err
      else
        pending=files.length
        for file, pos in files
          fs.stat path+"/"+file, (err,stats) ->
            if err?
              pending -= 1
              console.log err
            else
              if stats.isDirectory()
                recurseDir path+"/"+file, done
              if stats.isFile()
                intFileHandler path+"/"+file, done

  recurseDir startDir, -> callback()

exports.fileVisitor = fileVisitor
