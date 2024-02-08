const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const webpack = require("webpack");
module.exports = {
  mode: "development",
  entry: "./src/index.js",
  resolve: {
    fallback: {
      os: require.resolve("os-browserify/browser"),
      util: require.resolve("util/"),
      buffer: require.resolve("buffer/"),
      fs: false, // Remove fs alias
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      dgram: require.resolve("dgram-browserify"),
      child_process: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  plugins: [
    // new NodePolyfillPlugin(),
    new webpack.ProvidePlugin({
      child_process: "child_process_mock", // Replace with a suitable mock
    }),
  ],
};
