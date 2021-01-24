// Определение констант Gulp
const { src, dest, parallel, series, watch } = require("gulp");

const browserSync = require("browser-sync").create();
const bssi = require("browsersync-ssi");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify-es").default;
const sass = require("gulp-sass");
const babel = require("gulp-babel");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const cleancss = require("gulp-clean-css");
const size = require("gulp-size");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const recompress = require("imagemin-jpeg-recompress");
const pngquant = require("imagemin-pngquant");
const del = require("del");
const gcmq = require("gulp-group-css-media-queries");
const fileinclude = require("gulp-file-include");
const svgmin = require("gulp-svgmin");
const svgsprite = require("gulp-svg-sprite");
const ttf2woff2 = require("gulp-ttftowoff2");
const ttf2woff = require("gulp-ttf2woff");
const ttf2eot = require("gulp-ttf2eot");

const jsFiles = [
  "node_modules/jquery/dist/jquery.js",
  "node_modules/aos/dist/aos.js",
  "!src/js/main.min.js",
  "src/js/main.js",
];

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "src",
      index: "index.html",
      middleware: bssi({ baseDir: "src/", ext: ".html" }),
    }, // Папка сервера (Исходные файлы)
    notify: false,
    online: true,
    open: false,
    tunnel: "cloudy1gor", // URL https://cloudy1gor.loca.lt
  });
}

function html() {
  return src(["src/html/pages/*.html", "!src/html/components/_*.html"])
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "./src/",
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
    .pipe(dest("src/"))
    .pipe(browserSync.stream());
}

function scripts() {
  return src(jsFiles)
    .pipe(babel({ presets: ["@babel/env"] }))
    .pipe(concat("main.min.js"))
    .pipe(uglify()) // Сжатие JavaScript кода
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(dest("src/js/"))
    .pipe(browserSync.stream());
}

function styles() {
  return src("src/scss/style.scss")
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded", // "compressed"
      }).on("error", sass.logError)
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
      cleancss({
        level: {
          2: {
            specialComments: 0,
          },
        },
      })
    ) // format: "beautify",
    .pipe(concat("style.min.css"))
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(sourcemaps.write())
    .pipe(dest("src/css/"))
    .pipe(browserSync.stream());
}

function images() {
  return src("src/images/src/**/*")
    .pipe(newer("src/images/dest")) // не сжимать изображение повторно
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
                quality: [0.7, 0.9],
                strip: true,
                speed: 1,
              }),
            ],
          }),
          imagemin.gifsicle(),
          imagemin.optipng(),
          imagemin.svgo(),
        ]
      )
    )
    .pipe(
      size({
        gzip: true,
        pretty: true,
        showFiles: true,
        showTotal: true,
      })
    )
    .pipe(dest("src/images/dest"));
}

function svg2sprite() {
  return src("src/images/src/icons/*.svg")
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
    .pipe(dest("src/images/src"));
}

function towoff() {
  return src("src/fonts/*.ttf").pipe(ttf2woff()).pipe(dest("src/fonts/"));
}

function towoff2() {
  return src("src/fonts/*.ttf").pipe(ttf2woff2()).pipe(dest("src/fonts/"));
}

function toeot() {
  return src("src/fonts/*.ttf").pipe(ttf2eot()).pipe(dest("src/fonts/"));
}

function cleanimg() {
  return del("src/images/dest/**/*", {
    force: true,
  }); // Удаляем всё содержимое папки "src/images/#dest/"
}

function cleandist() {
  return del("dist/**/*", {
    force: true,
  }); // Удаляем всё содержимое папки "dist"
}

function buildcopy() {
  return src(
    [
      "src/*.html",
      "src/css/**/*.min.css",
      "src/js/**/main.min.js",
      "src/images/dest/**/*",
      "src/fonts/*",
    ],
    {
      base: "src",
    }
  ) // Сохраняем структуру src при копировании
    .pipe(dest("dist")); // Выгружаем финальную сборку в папку dist
}

function startwatch() {
  watch("src/html/**/*", html);

  watch("src/scss/**/*", styles);

  watch(["src/**/*.js", "!src/**/*.min.js"], scripts);

  watch("src/images/src/**/*", images);

  watch("src/images/src/icons/*.svg", svg2sprite);
}

exports.browsersync = browsersync;

exports.html = html;

exports.scripts = scripts;

exports.styles = styles;

exports.images = images;

exports.svg2sprite = svg2sprite;

exports.towoff = towoff;

exports.towoff2 = towoff2;

exports.toeot = toeot;

exports.cleandist = cleandist;

exports.cleanimg = cleanimg;

exports.build = series(cleandist, styles, scripts, images, buildcopy);

exports.default = parallel(
  html,
  svg2sprite,
  styles,
  scripts,
  browsersync,
  startwatch
);
