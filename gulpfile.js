"use strict";

const { src, dest, parallel, series, watch } = require("gulp");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const rename = require("gulp-rename");
const webpack = require("webpack-stream");
const sass = require("gulp-sass");
const cleancss = require("gulp-clean-css");
const autoprefixer = require("gulp-autoprefixer");
const sourcemaps = require("gulp-sourcemaps");
const gcmq = require("gulp-group-css-media-queries");
const size = require("gulp-size");

// Paths
const source = "src/";
const build = "./";

const path = {
	build: {
		css: build + "assets/css",
		js: build + "assets/js",
		img: build + "assets/img",
		svg: build + "assets/img/svg",
		fonts: build + "assets/fonts",
	},
	src: {
		css: source + "assets/scss/style.scss",
		js: source + "assets/js/main.js",
		img: source + "assets/images/*.{jpg,jpeg,png}",
		svg: source + "assets/images/svg/*.svg",
		fonts: source + "assets/fonts/**/*",
	},
    watch: {
		css: source + "assets/scss/**/*.scss",
		js: source + "assets/js/**/*.js",
		img: [source + "assets/images/**/*.{jpg,png,jpeg,svg,gif,webp}", "!**/favicon.*"],
		svg: [source + "assets/images/svg/*.svg", source + "img/**/favicon.*"],
		fonts: source + "assets/fonts/**/*.*",
	},
	clean: build,
}

function scripts() {
    return src(path.src.js)
        .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
        .pipe(
            webpack(require("./webpack.config.js"))
        )
        .pipe(plumber.stop())
        .pipe(dest(path.build.js))
        .pipe(
            size({
                showFiles: true,
            })
        )
}

function styles() {
    return src(path.src.css)
        .pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
        .pipe(sourcemaps.init())
        .pipe(sass({ outputStyle: "expanded" }))
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 8 versions"],
                cascade: true,
                browsers: ["Android >= 6", "Chrome >= 20", "Firefox >= 24", "Explorer >= 11", "iOS >= 6", "Opera >= 12", "Safari >= 6"],
            })
        )
        .pipe(gcmq())
        .pipe(
            cleancss({
                level: {
                    2: {
                        specialComments: 0,
                        // format: "beautify",
                    },
                },
            })
        )
        .pipe(rename({
            suffix: ".min",
            extname: ".css"
          }))
        .pipe(plumber.stop())
        .pipe(sourcemaps.write("."))
        .pipe(dest(path.build.css))
        .pipe(
            size({
                showFiles: true,
            })
        )
}

function images() {
    return src(path.src.img)
        .pipe(dest(path.build.img));
}

function fonts() {
    return src(path.src.fonts)
        .pipe(dest(path.build.fonts));
}

function startWatch() {
    watch(path.watch.css, styles);
    watch(path.watch.js, scripts);
	watch(path.watch.img, images);
    watch(path.watch.fonts, fonts);
}

exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.fons = fonts;

exports.default = series(parallel(scripts, styles, images, fonts, startWatch));