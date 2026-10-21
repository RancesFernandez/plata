const fs = require('node:fs');
const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const root = __dirname;
const env = { ...process.env };

function loadEnv(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return;
  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (env[key] === undefined) env[key] = value;
  }
}

loadEnv('.env');
loadEnv('.env.local');
const firebaseKeys = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
];
const defines = Object.fromEntries(firebaseKeys.map((key) => [`process.env.${key}`, JSON.stringify(env[key] || '')]));

module.exports = {
  entry: path.resolve(root, 'src/main.jsx'),
  output: {
    path: path.resolve(root, 'build'),
    filename: 'assets/[name].[contenthash:8].js',
    publicPath: '/',
    clean: true,
  },
  resolve: { extensions: ['.js', '.jsx', '.json'] },
  module: {
    rules: [
      { test: /\.jsx?$/, exclude: /node_modules/, use: 'babel-loader' },
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: path.resolve(root, 'index.html'), title: 'Plata — tus finanzas, más claras' }),
    new webpack.DefinePlugin(defines),
  ],
  devServer: {
    port: 5173,
    host: '127.0.0.1',
    hot: true,
    historyApiFallback: true,
    open: false,
    static: { directory: path.resolve(root, 'public'), watch: true },
  },
  performance: { hints: false },
};
