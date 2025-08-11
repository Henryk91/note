// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const CleanWebpackPlugin = require('clean-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const outputDirectory = 'dist';

module.exports = {
  mode: 'development', // or 'production'
  entry: [
    // If you still need polyfills:
    // 'core-js/stable',
    // 'regenerator-runtime/runtime',
    './src/client/index.js'
  ],
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: 'bundle.[contenthash].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader' }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', // injects CSS into DOM
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              // modules: true, // enable only if you actually use CSS Modules
            }
          }
        ]
      },
      // Asset Modules (replaces url-loader/file-loader)
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset', // auto inline small assets, emit files for larger ones
        parser: { dataUrlCondition: { maxSize: 100 * 1024 } } // ~100 KB
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: 'asset/resource' // always emit file (better for fonts)
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devServer: {
    port: 3000,
    open: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:8080',
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new CleanWebpackPlugin([outputDirectory]),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico'
    }),
    new InjectManifest({
      swSrc: path.join(__dirname, './src/sw.js'),
      swDest: 'sw.js',
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
    }),
    new CopyPlugin({
    patterns: [
      { from: './src/manifest.json', to: 'manifest.json' },
      { from: './public/favicon.png', to: 'favicon.png' },
      { from: './public/favicon512.png', to: 'favicon512.png' },
    ]
  }),
  ]
};
