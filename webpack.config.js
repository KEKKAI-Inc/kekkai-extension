var path = require('path');

var { CleanWebpackPlugin } = require('clean-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var fileSystem = require('fs-extra');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var TerserPlugin = require('terser-webpack-plugin');
var webpack = require('webpack');

var env = require('./utils/env');

const targetBrowser = process.env.TARGET_BROWSER;
const buildPath = path.join(__dirname, 'build', targetBrowser);
const extensionsPath = path.join(__dirname, 'src', 'extensions');
const isWeb = targetBrowser === 'web';

const ASSET_PATH = process.env.ASSET_PATH || '/';

var alias = {
  'react-dom': '@hot-loader/react-dom',
  '@': path.resolve(__dirname, 'src'),
};

// load the secrets
var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'eot', 'otf', 'svg', 'ttf', 'woff', 'woff2'];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

var options = {
  mode: process.env.NODE_ENV || 'development',
  entry: isWeb
    ? {
        index: path.join(__dirname, 'src', 'index.tsx'),
      }
    : {
        manifest: './src/manifest.json',
        index: path.join(__dirname, 'src', 'index.tsx'),
        background: path.join(extensionsPath, 'background', 'index.ts'),
        content: path.join(extensionsPath, 'content', 'index.ts'),
        injected: path.join(extensionsPath, 'injected', 'index.ts'),
        feedback: path.join(extensionsPath, 'injected', 'feedback.tsx'),
      },
  chromeExtensionBoilerplate: {
    notHotReload: isWeb ? [] : ['background', 'content'],
  },
  output: {
    filename: isWeb ? '[name]-[contenthash].bundle.js' : '[name].bundle.js',
    path: buildPath,
    clean: true,
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        // look for .css or .scss files
        test: /\.(css|scss)$/,
        // in the `src` directory
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        type: 'asset/resource',
        exclude: /node_modules/,
        // loader: 'file-loader',
        // options: {
        //   name: '[name].[ext]',
        // },
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      { test: /\.(ts|tsx)$/, loader: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'react-svg-loader',
            options: {
              jsx: true, // true outputs JSX tags
            },
          },
        ],
      },
      ...(isWeb
        ? []
        : [
            {
              type: 'javascript/auto', // prevent webpack handling json with its own loaders,
              test: /manifest\.json$/,
              use: 'wext-manifest-loader',
              exclude: /node_modules/,
            },
          ]),
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map((extension) => '.' + extension)
      .concat([
        ...(isWeb ? ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.web.css'] : []),
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.css',
      ]),
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.TARGET_BROWSER': JSON.stringify(process.env.TARGET_BROWSER),
    }),
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    new webpack.EnvironmentPlugin(['NODE_ENV']),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/public',
          to: buildPath,
          force: true,
        },
      ],
      options: {},
    }),

    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'index.html'),
      filename: 'index.html',
      chunks: ['index'],
      cache: false,
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
