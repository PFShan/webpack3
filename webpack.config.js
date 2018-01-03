/**
 * Created by shanpengfei051 on 2018/1/3.
 */
const path = require('path')
const uglify = require('uglifyjs-webpack-plugin')  //JS压缩组件
const htmlPlugin= require('html-webpack-plugin')   //html打包组件
/*
 extract-text-webpack-plugin
这个插件就可以完美的解决我们提取CSS的需求，但是webpack官方其实并不建议这样作，
他们认为CSS就应该打包到JavasScript当中以减少http的请求数
 npm install --save-dev extract-text-webpack-plugin
*/
const extractTextPlugin = require('extract-text-webpack-plugin')
// 因为我们需要同步检查html模板，所以我们需要引入node的glob对象使用。在webpack.config.js文件头部引入glob。
const glob = require('glob')
// 引入purifycss-webpack
const PurifyCSSPlugin = require("purifycss-webpack");

// 模块化
const entry = require("./entry_webpack")
module.exports = {
    // 入口文件配置项
    // entry: {
    //     entry: './src/entry.js'
    // },
    entry: entry.path,
    // 出口文件配置项,webpack2.X之后支持多出口配置
    output:{
        // 打包的路径位置
        path: path.resolve(__dirname, 'dist'), // 获取项目的绝对路径
        // 打包的文件名称   [name]的意思是根据入口文件的名称，打包成相同的名称，有几个入口文件，就可以打包出几个文件。
        filename: '[name].js'
    },
    // 模块：例如解读CSS,图片如何转换压缩
    /*记得在loader使用时不需要用require引入，在plugins才需要使用require引入。

    * file-loader可以解析项目中的url引入（不仅限于css），根据我们的配置，将图片拷贝到相应的路径，再根据我们的配置，修改打包后文件引用路径，使之指向正确的文件
    *
    * url-loader  如果图片较多，会发很多http请求，会降低页面性能。这个问题可以通过url-loader解决。url-loader会将引入的图片编码，生成dataURl。
    * 相当于把图片数据翻译成一串字符。再把这串字符打包到文件中，最终只需要引入这个文件就能访问图片了。当然，如果图片较大，编码会消耗性能。
    * 因此url-loader提供了一个limit参数，小于limit字节的文件会被转为DataURl，大于limit的还会使用file-loader进行copy。
    *
    * less 文件的打包和分离  和css相似   npm install --save-dev less    npm install --save-dev less-loader
    *
    * sass 文件的打包和分离  因为sass-loader依赖于node-sass，所以需要先安装node-sass
    * npm install --save-dev node-sass     npm install --save-dev sass-loader
    *
    * 自动处理CSS3属性前缀   npm install --save-dev postcss-loader autoprefixer   配置看官网
    *
    * 消除未使用的CSS    PurifyCSS   	npm i -D purifycss-webpack purify-css
    * -D代表的是–save-dev ,只是一个简写
    *
    *
    * */
    module: {
        rules: [
            {
                test: /\.css$/,
                // use: ['style-loader', 'css-loader']
                // npm install style-loader --save-dev    npm install --save-dev css-loader
                use: extractTextPlugin.extract({
                    fallback: "style-loader",
                    use: "css-loader"
                }) // css打包的loader

            },{
                test: /\.(png|jpg|gif)/,  // 匹配图片文件后缀名称
                use: [{
                    /*url-loader封装了file-loader。url-loader不依赖于file-loader，即使用url-loader时，只需要安装url-loader即可，
                    不需要安装file-loader，因为url-loader内置了file-loader
                     url-loader工作分两种情况:
                     1.文件大小小于limit参数，url-loader将会把文件转为DataURL（Base64格式）；

                     2.文件大小大于limit，url-loader会调用file-loader进行处理，参数也会直接传给file-loade
                    */
                    loader: 'url-loader',
                    options: {
                        limit: 8192,    // 把小于8192B的文件打成Base64的格式，写入JS
                        // outputPath: 'images/',
                        name: 'images/[name].[hash].[ext]',  // 放在文件夹的路径及命名
                        publicPath: '../'  // 路径上添加两个点指向正确路径
                    }
                }]  //指定使用的loader和loader的配置参数
            },{
                test: /\.scss$/,
                use: extractTextPlugin.extract({
                    use: [{
                        loader: "css-loader"
                    }, {
                        loader: "sass-loader"
                    }],
                    // use style-loader in development
                    fallback: "style-loader"
                })
                // use: [{
                //     loader: "style-loader"
                // },{
                //     loader: "css-loader"
                // },{
                //     loader: "sass-loader"
                // }]  // 需要注意的是loader的加载要有先后顺序
            },{
            /*
            * Babel其实是几个模块化的包，其核心功能位于称为babel-core的npm包中，
            * webpack可以把其不同的包整合在一起使用，对于每一个你需要的功能或拓展，
            * 你都需要安装单独的包
            * （用得最多的是解析ES6的babel-preset-es2015包和解析JSX的babel-preset-react包）
            * cnpm install --save-dev babel-core babel-loader babel-preset-es2015 babel-preset-react
            *
             * */
                test:/\.(jsx|js)$/,
                use:{
                    loader:'babel-loader',
                    options:{
                        presets:[
                            "es2015","react"
                        ]
                    }
                },
                exclude:/node_modules/
            }
        ]
    },
    // 插件，用于生产模板和各项功能
    // 根据需要配置不同的功能插件
    plugins: [
        new uglify(),    // new一个 uglify对象
        new htmlPlugin({
            minify: {
                removeAttributeQuotes: true
            },// 对html进行压缩
            hash: true, // 加入hash,有效避免缓存JS
            template: './src/index.html' // 打包html模板路径和文件名称
        }),
        new extractTextPlugin("css/[name].[contenthash].css"), // 这里的css/index.css是分离后的路径位置
        new PurifyCSSPlugin({
            // Give paths to parse for rules. These should be absolute!
            paths: glob.sync(path.join(__dirname, 'src/*.html')),
        })
        /*
        * paths: 查找html模板，purifycss根据这个配置会遍历你的文件，查找哪些css被使用了
        * 配置好上边的代码，我们可以故意在css文件里写一些用不到的属性，然后用webpack打包，你会发现没用的CSS已经自动给你删除掉了
        * */
    ],
    // 配置webpack开发服务功能    服务和热更新 npm install webpack-dev-server --save-dev
    devServer: {
        // 设置基本的目录结构
        contentBase:path.resolve(__dirname, 'dist'),
        // 服务器的IP地址，可以使用IP也可以使用localhost
        host: 'localhost',
        // 服务端压缩是否开启
        compress: true,
        // 配置端口号
        port: 1717
    }
}
