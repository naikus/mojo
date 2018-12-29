var gulp = require("gulp"),
    del = require("del"),
    jshint = require("gulp-jshint"),
    concat = require("gulp-concat"),
    uglify = require("gulp-uglify"),
    less = require("gulp-less"),
    // eventStream = require("event-stream"),
    mergestream = require("merge-stream"),
    connect = require("gulp-connect");


var config = {
  src: {
    dir: "src/www/",
    assets: [
      "css/",
      "fonts/",
      "res/",
      "images/",
      "libs/",
      "js/",
      "modules/",
      "!less"
    ]
  },
  dist: {
    app_dir: "dist/",
    css_dir: "dist/css"
  }
};

gulp.task("default", function() {
  console.log("Available tasks:");
  console.log([
    "------------------------------------------------------------------------",
    "build           Build webapp in the dest directory",
    "clean           Clean the dest directory",
    "-------------------------------------------------------------------------"
  ].join("\n"));
});


gulp.task("jshint", function() {
  return gulp.src(["src/www/js", "!src/www/js/lib"])
      .pipe(jshint())
      .pipe(jshint.reporter("default"));
});


gulp.task("lessc", function() {
  return gulp.src(config.src.dir + "less/app.less")
      .pipe(less())
      .pipe(gulp.dest(config.dist.css_dir));
});


gulp.task("clean", function(cb) {
  del([
    config.dist.app_dir
  ], cb);
});


gulp.task("build", gulp.series("clean", "jshint", "lessc", function() {
  // gulp.start("jshint", "lessc");
  var src = config.src.dir, dist = config.dist.app_dir;
  config.src.assets.forEach(function(ass) {
    gulp.src(src + ass + "**/*")
        .pipe(gulp.dest(dist + ass));
  });

  return gulp.src([
    src + "*.{html, js, css, png}"
  ]).pipe(gulp.dest(dist));

}));


gulp.task("server", function() {
  connect.server({
    root: "dist",
    post: 8080
  });
});
