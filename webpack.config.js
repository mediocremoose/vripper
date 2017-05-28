'use strict'

module.exports = {
  entry:  __dirname + '/app/index.js',
  output: {
    path: __dirname + '/build',
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  plugins: [],
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
        presets: ['react', 'es2015']
      }
    }, {
      test: /\.css/,
      loaders: ['style-loader', 'css-loader']
    }]
  },
  externals: [/^[a-z\-0-9]+$/]
}
