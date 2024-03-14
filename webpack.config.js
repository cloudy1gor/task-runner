// import TerserPlugin from "terser-webpack-plugin";

const path = "./src/assets/js/";

const config = {
    mode: "production",
    entry: {
		main: path + "main.js",
	},
    output: {
        filename: "[name].min.js",
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    corejs: 3,
                                    useBuiltIns: "usage",
                                },
                            ],
                        ],
                    },
                },
            },
        ],
    },
    // optimization: {
    //     minimize: true,
    //     minimizer: [
    //       new TerserPlugin(),
    //     ],
    // },
};

module.exports = config;