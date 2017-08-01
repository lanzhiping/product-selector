const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const extractSass = new ExtractTextPlugin({
    filename: "[name].css"
});

module.exports = {
    entry: ["./client/index.js", "./client/main.scss"],

    output: {
        path: path.resolve(__dirname, 'dist'),

        filename: 'bundle.js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    presets: ["es2015"]
                },
            },
            {
                test: /\.scss$/,
                use: extractSass.extract({
                    use: [{
                        loader: "css-loader"
                    }, {
                        loader: "sass-loader"
                    }]
                })
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader'
                    // options: {
                    //     attrs: [':data-src']
                    // }
                }
            }
        ]
    },

    plugins: [
        extractSass
    ]
};
