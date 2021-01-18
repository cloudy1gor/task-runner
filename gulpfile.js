// Определение констант Gulp
const { src, dest, parallel, series, watch } = require("gulp");

const browserSync = require("browser-sync").create();
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
const imagemin = require("gulp-imagemin");
const recompress = require("imagemin-jpeg-recompress");
const pngquant = require("imagemin-pngquant");
const newer = require("gulp-newer");
const del = require("del");
const gcmq = require("gulp-group-css-media-queries");
const fileinclude = require("gulp-file-include");
const htmlmin = require("gulp-htmlmin");
const rename = require("gulp-rename");
const svgmin = require("gulp-svgmin");
const svgsprite = require("gulp-svg-sprite");

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
  return src(["app/html/pages/*.html", "!app/html/components/_*.html"])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "app/",
      })
    )
    .pipe(
      htmlmin({
        collapseWhitespace: false,
      })
    )
    .pipe(dest("app/"))
    .pipe(browserSync.stream());
}

function scripts() {
  return src([
    "node_modules/jquery/dist/jquery.js",
    "node_modules/aos/dist/aos.js",
    "!app/js/main.min.js",
    "app/js/main.js",
  ])
    .pipe(concat("main.min.js"))
    .pipe(uglify()) // Сжатие JavaScript кода
    .pipe(dest("app/js/"))
    .pipe(browserSync.stream());
}

function styles() {
  return src([
    "node_modules/normalize.css/normalize.css",
    "!app/scss/_*.scss",
    "app/scss/style.scss",
  ])
    .pipe(
      sass({
        outputStyle: "expanded", // "compressed"
      })
    )
    .pipe(concat("style.css"))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 10 versions"],
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
    .pipe(dest("app/css/"))
    .pipe(
      rename(function (path) {
        path.basename += ".min";
      })
    )
    .pipe(
      cleancss({
        level: {
          1: {
            specialComments: 0,
          },
        },
      })
    ) // format: "beautify",
    .pipe(dest("app/css/"))
    .pipe(browserSync.stream());
}

function images() {
  return src("app/images/src/**/*")
    .pipe(newer("app/images/dest")) //было ли изменено (сжато) изображение ранее, что бы не сжимать его повторно
    .pipe(
      imagemin([
        recompress({
          loops: 4,
          min: 80,
          max: 100,
          quality: "high",
          use: [pngquant()],
        }),
        imagemin.gifsicle(),
        imagemin.optipng(),
        imagemin.svgo(),
      ])
    )
    .pipe(dest("app/images/dest"));
}

function svg2sprite() {
  return src("app/images/src/icons/*.svg")
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
    .pipe(dest("app/images/src"));
}

function cleanimg() {
  return del("app/images/dest/**/*", {
    force: true,
  }); // Удаляем всё содержимое папки "app/images/#dest/"
}

function cleandist() {
  return del("dist/**/*", {
    force: true,
  }); // Удаляем всё содержимое папки "dist"
}

function cleanicons() {
  return del("app/images/src/icons/*.svg", {
    force: true,
  }); // Удаляем всё содержимое папки "icons"
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

  watch("app/images/src/**/*", images);

  watch("app/images/src/icons/*.svg", svg2sprite);
}

exports.browsersync = browsersync;

exports.html = html;

exports.scripts = scripts;

exports.styles = styles;

exports.images = images;

exports.svg2sprite = svg2sprite;

exports.cleandist = cleandist;

exports.cleanimg = cleanimg;

exports.cleanicons = cleanicons;

exports.build = series(cleandist, styles, scripts, images, buildcopy);

exports.default = parallel(
  html,
  svg2sprite,
  styles,
  scripts,
  browsersync,
  startwatch
);
