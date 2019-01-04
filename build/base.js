const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
// var webpack = require('webpack');
const { win32 } = path;
const { dirname, basename } = win32;
var watcher = chokidar.watch(['./src/**/*.js'], function (event, path) {
  console.log(event, path)
})

watcher
  .on('change', (path, event) => {
    console.log('change::', path, event)
    console.log('basename(path)::', basename(path))
    console.log(dirname(path) ,'--', basename(path) )
  })