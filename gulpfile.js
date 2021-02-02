// Определение констант Gulp
const { src, dest, parallel, series, watch } = require("gulp");

const fileinclude = require("gulp-file-include");
const browserSync = require("browser-sync").create();
const concat = require("gulp-concat");
const babel = require("gulp-babel");
const plumber = require("gulp-plumber");
const gulpif = require("gulp-if");
const yargs = require("yargs").argv;
const notify = require("gulp-notify");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify-es").default;
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
const size = require("gulp-size");
const imagemin = require("gulp-imagemin");
const mozjpeg = require("imagemin-mozjpeg");
const pngquant = require("imagemin-pngquant");
const newer = require("gulp-newer");
const recompress = require("imagemin-jpeg-recompress");
const del = require("del");
const gcmq = require("gulp-group-css-media-queries");
const svgmin = require("gulp-svgmin");
const svgsprite = require("gulp-svg-sprite");
const ttf2woff2 = require("gulp-ttftowoff2");
const ttf2woff = require("gulp-ttf2woff");
const ttf2eot = require("gulp-ttf2eot");

const jsFiles = [
  "node_modules/jquery/dist/jquery.js",
  "node_modules/aos/dist/aos.js",
  "!app/js/main.min.js",
  "app/js/main.js",
];

const isProduction = yargs.env === "production" ? true : false;

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "./app",
      index: "index.html",
    }, // Папка сервера (Исходные файлы)
    notify: false,
    online: true,
    open: false,
  });
}

function html() {
  return src("app/html/pages/*.html")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "app/",
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
    .pipe(dest("app/"))
    .pipe(browserSync.stream());
}

function scripts() {
  return src(jsFiles)
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(gulpif(isProduction, uglify())) // Сжатие JavaScript кода
    .pipe(concat("main.min.js"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(dest("app/js/"))
    .pipe(browserSync.stream({ stream: true }));
}

function styles() {
  return src("app/scss/style.scss")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(gulpif(!isProduction, sourcemaps.init()))
    .pipe(
      sass({
        outputStyle: "expanded", // "compressed"
      })
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 8 versions"],
        cascade: true,
        browsers: [
          "Android >= 4",
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
      gulpif(
        isProduction,
        cleancss({
          level: {
            2: {
              specialComments: 0,
              // format: "beautify",
            },
          },
        })
      )
    )
    .pipe(concat("style.min.css"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(gulpif(!isProduction, sourcemaps.write()))
    .pipe(dest("app/css/"))
    .pipe(browserSync.stream({ stream: true }));
}

function images() {
  return src("app/images/**/*.+(jpg|jpeg|png|gif|svg|ico)")
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
    .pipe(newer("app/images")) // не сжимать изображения повторно
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(dest("app/images"))
    .pipe(browserSync.stream({ stream: true }));
}

function svg2sprite() {
  return src("app/images/icons/*.svg")
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
    .pipe(dest("app/images"))
    .pipe(browserSync.stream({ stream: true }));
}

function woff() {
  return src("app/fonts/*.ttf")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ttf2woff())
    .pipe(dest("app/fonts/"));
}

function woff2() {
  return src("app/fonts/*.ttf")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ttf2woff2())
    .pipe(dest("app/fonts/"));
}

function eot() {
  return src("app/fonts/*.ttf")
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(ttf2eot())
    .pipe(dest("app/fonts/"));
}

function cleandist() {
  return del("dist/**/*", {
    force: true,
  }); // Удаляем всё содержимое папки "dist"
}

function buildcopy() {
  return src(
    [
      "app/css/**/*.min.css",
      "app/js/**/main.min.js",
      "app/images/dest/**/*",
      "app/*.html",
    ],
    {
      base: "app",
    }
  ) // Сохраняем структуру app при копировании
    .pipe(dest("dist")); // Выгружаем финальную сборку в папку dist
}

function startwatch() {
  watch("app/html/**/*", html);

  watch("app/scss/**/*", styles);

  watch(["app/**/*.js", "!app/**/*.min.js"], scripts);

  watch("app/images/**/*", images);

  watch("app/images/icons/*.svg", svg2sprite);
}

exports.browsersync = browsersync;

exports.html = html;

exports.scripts = scripts;

exports.styles = styles;

exports.images = images;

exports.svg2sprite = svg2sprite;

exports.towoff = woff;

exports.towoff2 = woff2;

exports.toeot = eot;

exports.cleandist = cleandist;

exports.build = series(cleandist, styles, scripts, images, buildcopy);

exports.default = parallel(
  html,
  svg2sprite,
  styles,
  scripts,
  browsersync,
  startwatch
);
