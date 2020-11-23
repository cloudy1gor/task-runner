// Определение констант Gulp
const { src, dest, parallel, series, watch } = require("gulp");

//browser-sync для live reload
const browserSync = require("browser-sync").create();
//gulp-concat для объединения файлов
const concat = require("gulp-concat");
//gulp-uglify-es для сжатия js кода
const uglify = require("gulp-uglify-es").default;
//gulp-sass для scss
const sass = require("gulp-sass");
//Autoprefixer для добавления вендорных префиксов в CSS
const autoprefixer = require("gulp-autoprefixer");
//gulp-clean-css для оптимизации CSS
const cleancss = require("gulp-clean-css");
//gulp-imagemin для сжатия изображений
const imagemin = require("gulp-imagemin");
const recompress = require("imagemin-jpeg-recompress");
const pngquant = require("imagemin-pngquant");
//gulp-newer для отслеживания новых файлов
const newer = require("gulp-newer");
//del для удаления файлов
const del = require("del");
//Группирует медиа
const gcmq = require("gulp-group-css-media-queries");
//fileinclude подключает файлы
const fileinclude = require("gulp-file-include");
// минифицирует html
const htmlmin = require("gulp-htmlmin");

function browsersync() {
  browserSync.init({
    server: { baseDir: "app/", index: "home.html" }, // Папка сервера (Исходные файлы)
    notify: false,
    online: true,
  });
}

function html() {
  return (
    src(["./app/html/pages/*.html", "!./app/html/components/_*.html"])
      .pipe(
        fileinclude({
          prefix: "@@",
          basepath: "./app",
        })
      )
      // .pipe(htmlmin({ collapseWhitespace: false }))
      .pipe(dest("./app"))
      .pipe(browserSync.stream())
  );
}

function scripts() {
  return src([
    "node_modules/jquery/dist/jquery.min.js",
    "node_modules/slick-carousel/slick/slick.min.js",
    "node_modules/mixitup/dist/mixitup.min.js",
    "node_modules/@fancyapps/fancybox/dist/jquery.fancybox.js",
    "!app/js/main.min.js",
    "app/js/main.js",
  ])
    .pipe(concat("main.min.js")) // Объединяет в один файл "main.min.js"
    .pipe(uglify()) // Сжатие JavaScript кода
    .pipe(dest("app/js/"))
    .pipe(browserSync.stream());
}

function styles() {
  return src([
    "node_modules/normalize.css/normalize.css",
    "!app/scss/_*.scss",
    "app/scss/*.scss",
  ])
    .pipe(
      sass({
        outputStyle: "expanded", // "compressed"
      })
    ) // Преобразовываем scss в css
    .pipe(concat("style.css")) //в один файл "style.css"
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
    .pipe(dest("app/css/")) // Выгружаем результат в папку "app/css/style.css"
    .pipe(concat("style.min.css")) // Объединяет в один файл "style.min.css"
    .pipe(
      cleancss({
        level: { 1: { specialComments: 0 } },
      })
    ) // Минифицирует стили. format: "beautify",
    .pipe(dest("app/css/")) // Выгружаем результат в папку "app/css/style.min.css"
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
    ) // Сжимаем и оптимизируем изображеня
    .pipe(dest("app/images/dest"));
}

function cleanimg() {
  return del("app/images/dest/**/*", { force: true }); // Удаляем всё содержимое папки "app/images/#dest/"
}

function cleandist() {
  return del("dist/**/*", { force: true }); // Удаляем всё содержимое папки "dist"
}

function buildcopy() {
  return src(
    [
      "app/css/**/style.min.css",
      "app/js/**/main.min.js",
      "app/images/dest/**/*",
      "app/**/*.html",
      "!app/**/_*.html",
    ],
    { base: "app" }
  ) // Сохраняем структуру app при копировании
    .pipe(dest("dist")); // Выгружаем финальную сборку в папку dist
}

function startwatch() {
  watch("app/html/**/*", html);

  watch("app/scss/**/*", styles);

  watch(["app/**/*.js", "!app/**/*.min.js"], scripts);

  watch("app/images/src/**/*", images);
}

exports.browsersync = browsersync;

exports.html = html;

exports.scripts = scripts;

exports.styles = styles;

exports.images = images;

exports.cleandist = cleandist;

exports.build = series(cleandist, styles, scripts, images, buildcopy);

exports.default = parallel(styles, scripts, browsersync, startwatch);
