const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');

module.exports = {
  entry: "./scripts/start.js",
  output: {
    // path: path.resolve(__dirname, "./target/"),
    path: path.resolve(__dirname, "./docs/"),

    filename: "start.js",
  },
  mode: "development",
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "index.html", to: "index.html" },
        { from: "styles/index.css", to: "index.css" },
      ],
      options: {
        concurrency: 100,
      },
    }),
  ],
};
