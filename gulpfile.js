// Определение констант Gulp
const { src, dest, parallel, series, watch } = require("gulp");

const pug = require("gulp-pug");
const fileinclude = require("gulp-file-include");
const htmlmin = require("gulp-htmlmin");
const webpack = require("webpack-stream");
const browserSync = require("browser-sync").create();
const rename = require("gulp-rename");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const fibers = require("fibers"); // для лучшей компиляции scss
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
const size = require("gulp-size");
const imagemin = require("gulp-imagemin");
const mozjpeg = require("imagemin-mozjpeg");
const pngquant = require("imagemin-pngquant");
const changed = require("gulp-changed");
const recompress = require("imagemin-jpeg-recompress");
const del = require("del");
const gcmq = require("gulp-group-css-media-queries");
const svgmin = require("gulp-svgmin");
const svgcss = require("gulp-svg-css-pseudo");
const svgsprite = require("gulp-svg-sprite");
const ttf2woff2 = require("gulp-ttftowoff2");
const ttf2woff = require("gulp-ttf2woff");
const ttf2eot = require("gulp-ttf2eot");

// кастом
const images = parallel(img, svg2css, svg2sprite);
const fonts = series(woff, woff2, eot);
const jsFiles = ["src/js/main.js"];

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "./dist",
      index: "index.html",
    },
    open: false,
    notify: true,
    online: false,
    logPrefix: "Sempai🔥",
    logLevel: "info",
  });
}

function html() {
  return src(["src/templates/pages/*.html", "src/templates/pages/*.pug"])
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "src/",
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(
      pug({
        pretty: false, // Форматирование
      })
    )
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(dest("dist/"))
    .pipe(browserSync.reload({ stream: true }));
}

function scripts() {
  return src(jsFiles)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      webpack({
        mode: "production",
        output: {
          filename: "main.min.js",
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
      })
    )
    .pipe(dest("dist/js/"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(browserSync.reload({ stream: true }));
}

function styles() {
  return src("src/scss/style.scss")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: "expanded" }, { fibers: fibers }))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 8 versions"],
        cascade: true,
        browsers: [
          "Android >= 6",
          "Chrome >= 20",
          "Firefox >= 24",
          "Explorer >= 11",
          "iOS >= 6",
          "Opera >= 12",
          "Safari >= 6",
        ],
      })
    ) // Добавляет вендорные префиксы
    .pipe(gcmq()) //Группирует медиа
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
    .pipe(rename("style.min.css"))
    .pipe(sourcemaps.write("."))
    .pipe(dest("dist/css/"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(browserSync.reload({ stream: true }));
}

function img() {
  return src([
    "src/images/**/*.+(jpg|jpeg|png|gif|svg|ico)",
    "!src/images/svg/**/*.svg",
  ])
    .pipe(changed("dist/images")) // не сжимать повторно
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      imagemin(
        {
          interlaced: true,
          progressive: true,
          optimizationLevel: 5,
        },
        [
          recompress({
            loops: 6,
            min: 50,
            max: 90,
            quality: "high",
            use: [
              pngquant({
                quality: [0.65, 0.8],
                strip: true,
                speed: 1,
                floyd: 0,
              }),
            ],
          }),
          imagemin.gifsicle(),
          imagemin.optipng(),
          mozjpeg({
            quality: 85,
            progressive: true,
          }),
          imagemin.svgo(),
        ]
      )
    )
    .pipe(dest("dist/images"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(browserSync.reload({ stream: true }));
}

function svg2css() {
  return src("src/images/svg/css/*.svg")
    .pipe(
      svgmin({
        plugins: [
          {
            removeComments: true,
          },
          {
            removeEmptyContainers: true,
          },
        ],
      })
    )
    .pipe(
      svgcss({
        fileName: "_sprite",
        fileExt: "scss",
        cssPrefix: "svg",
        addSize: false,
      })
    )
    .pipe(dest("./src/scss"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    );
}

function svg2sprite() {
  return src("src/images/svg/icons/*.svg")
    .pipe(changed("dist/images")) // не сжимать повторно
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      svgmin({
        plugins: [
          {
            removeComments: true,
          },
          {
            removeEmptyContainers: true,
          },
        ],
      })
    )
    .pipe(
      svgsprite({
        mode: {
          stack: {
            sprite: "../sprite.svg",
          },
        },
        shape: {
          dimension: {
            maxWidth: 50,
            maxHeight: 50,
          },
        },
      })
    )
    .pipe(dest("dist/images"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(browserSync.reload({ stream: true }));
}

function woff() {
  return src("src/fonts/*.ttf")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      changed("dist/fonts", {
        extension: ".woff",
        hasChanged: changed.compareLastModifiedTime,
      })
    )
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ttf2woff())
    .pipe(dest("dist/fonts/"));
}

function woff2() {
  return src("src/fonts/*.ttf")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      changed("dist/fonts", {
        extension: ".woff2",
        hasChanged: changed.compareLastModifiedTime,
      })
    )
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ttf2woff2())
    .pipe(dest("dist/fonts/"));
}

function eot() {
  return src("src/fonts/*.ttf")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      changed("dist/fonts", {
        extension: ".eot",
        hasChanged: changed.compareLastModifiedTime,
      })
    )
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ttf2eot())
    .pipe(dest("dist/fonts/"));
}

function cleanimg() {
  return del("dist/images/**/*", {
    force: true,
  }); // Удаление папки "dist/images"
}

function cleandist() {
  return del("dist/**/*", {
    force: true,
  }); // Удаляем всё содержимое папки "dist"
}

function copy() {
  return src(["src/sites/**/*", "src/fonts/*"], {
    base: "src",
  }).pipe(dest("dist"));
}

function startwatch() {
  watch("src/templates/**/*.+(html|pug)", html);

  watch("src/scss/**/*.scss", styles);

  watch(["src/js/**/*.js", "!src/js/*.min.js"], scripts);

  watch("src/images/**/*.+(jpg|jpeg|png|gif|svg|ico)", img);

  watch("src/images/svg/icons/*.svg", svg2sprite);

  watch("src/images/svg/css/*.svg", svg2css);

  watch("src/fonts/*ttf", fonts);
}

exports.browsersync = browsersync;

exports.html = html;

exports.scripts = scripts;

exports.styles = styles;

exports.cleanimg = cleanimg;

exports.cleandist = cleandist;

exports.cop = series(copy);

exports.default = series(
  parallel(html, scripts, styles, images, fonts, browsersync, startwatch)
);
