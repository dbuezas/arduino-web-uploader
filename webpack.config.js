const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: './dist/test.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'test'),
  },
  resolve: { alias: { stream: 'stream-browserify', buffer: 'buffer', process: 'process/browser' } },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process',
    }),
  ],
}
