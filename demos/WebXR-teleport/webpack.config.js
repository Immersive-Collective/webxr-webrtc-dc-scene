const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { IgnorePlugin } = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    devtool: 'source-map',
    module: {
        rules: [{
                test: /\.handpose$/,
                use: 'file-loader',
                include: [path.resolve(__dirname, 'node_modules/handy-work/poses')],
            },
            {
                test: /\.wasm$/,
                type: "webassembly/async"
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.(glb|gltf)$/,
                use: {
                    loader: '@loaders.gl/gltf',
                    options: { type: 'arraybuffer' }
                }
            },
            {
                test: /\.(png|jpg|jpeg|gif|svg)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'assets/images/',
                    },
                }, ],
            }
        ]
    },
    plugins: [

        new IgnorePlugin({
            resourceRegExp: /\.(blend|blend1|.DS_Store|md|txt)$/
        }),

        new HtmlWebpackPlugin({
            title: 'Three.js with Webpack',
            template: './src/index.html',
        }),
        new CopyPlugin({

            patterns: [{
                    from: 'src/libs/hands/models',
                    to: 'hands/models',
                    globOptions: {
                        ignore: ['**/*.blend', '**/*.blend1', '**/.DS_Store', '**/*.txt', '**/*.md']
                    },
                },
                { from: 'src/assets/models', to: 'assets/models', globOptions: { ignore: ['**/*.blend', '**/*.blend1', '**/.DS_Store', '**/*.txt', '**/*.md'] } },
                { from: 'src/assets/audio', to: 'assets/audio', globOptions: { ignore: ['**/*.blend', '**/*.blend1', '**/.DS_Store', '**/*.txt', '**/*.md'] } },
                /*                { from: 'src/assets/fonts', to: 'assets/fonts' },
                 */
                { from: 'src/assets/videos', to: 'assets/videos', globOptions: { ignore: ['**/*.blend', '**/*.blend1', '**/.DS_Store', '**/*.txt', '**/*.md'] } },
                { from: 'src/assets/data', to: 'assets/data', globOptions: { ignore: ['**/*.blend', '**/*.blend1', '**/.DS_Store', '**/*.txt', '**/*.md'] } },
                {
                    from: 'src/assets/images',
                    to: 'assets/images',
                    globOptions: {
                        ignore: ['**/*.blend', '**/*.blend1', '**/.DS_Store', '**/*.txt', '**/*.md'] // Ignore .psd and .blend files
                    }
                },
                { from: 'node_modules/three/examples/jsm/libs/draco/', to: 'draco_decoder/', globOptions: { ignore: ['**/*.blend', '**/*.blend1', '**/.DS_Store', '**/*.txt', '**/*.md'] } },
            ],


        }),
    ],
    devServer: {
        static: path.join(__dirname, 'dist'),
        https: {
            key: fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'localhost.pem')),
        },
    },
    experiments: {
        asyncWebAssembly: true
    },
};