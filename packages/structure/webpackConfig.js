const path = require('path');
// const webpack = require('webpack');
// const packageName = require('./package.json').name;
const cfg = {
  mode: 'development', // "production" | "development"
  entry: path.resolve(__dirname, './lib/structure.js'),
  output: {
    path: path.resolve(__dirname, './dist/'),
    filename: 'structure.js',
    library: 'Structure',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: {
    d3: 'd3'
  }
};
module.exports = cfg;
