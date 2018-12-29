var gulp = require("gulp"),
      cliargs = require("yargs").argv,
      gulpif = require("gulp-if"),
      jshint = require("gulp-jshint"),
      clean = require("gulp-clean"),
      del = require("del"),
      concat = require("gulp-concat"),
      uglify = require("gulp-uglify"),
      less = require("gulp-less"),
      debug = require("gulp-debug"),
      // eventStream = require("event-stream"),
      mergestream = require("merge-stream"),
      connect = require("gulp-connect");


/** 
 * Global level build configuration
 */
var config = {
   mojojs : [
      "LICENSE",
      "src/app/application.js",

      "src/binder/binder.js",
      "src/template/template.js",
      // "src/datalist/datalist.js",
      "src/datalist/repeat.js",
      "src/form/form.js",
      // "src/form/validator.js",
      "src/activables/activables.js",
      "src/notifications/notifications.js",
      // "src/tabstrip/tabstrip.js",
      "src/dialog/dialog.js"
   ],
   
   mojoless: [
      "LICENSE",
      
      "src/app/colors.less",
      "src/app/application.less",
      "src/app/base.less",
      "src/activables/activables.less",

      "src/datalist/datalist.less",
      "src/form/form.less",
      // "src/form/validator.less",
      "src/notifications/notifications.less",
      // "src/tabstrip/tabstrip.less",
      "src/dialog/dialog.less"
   ],
   
   src_dir: "src/",
   dist_dir: "dist/"
};

function getExample() {
   var example = cliargs.example;
   if(!example) {
      throw new Error("Please specify an example directory using the --example option")
   }
   return "examples/" + example;
}

/**
 * The default task
 */
gulp.task("default", function() {
   console.log("Available tasks:");
   console.log([
      "------------------------------------------------------------------------",
      "jshint          Run jshint on all the source files",
      "build           Build webapp in the dest directory",
      "build-example   Build a specified example",  
      "clean           Clean the dest directory",
      "-------------------------------------------------------------------------"
   ].join("\n"));
});


/**
 * Cleanup the dist directory
 */
gulp.task("clean", function(cb) {
   del([
     config.dist_dir
   ], cb);
 });


/**
 * Setup jshint for all app files
 */
gulp.task("jshint", function() {
   return gulp.src("src/**/*.js")
         .pipe(jshint({eqnull: true}))
         .pipe(jshint.reporter("default"));
});


/*
 * Our main task to build webapp. Here we ensure that clean task runs before
 * others
 */
gulp.task("build", gulp.series("jshint", function(cb) {
   return mergestream(
      gulp.src(config.mojojs/*, {debug: true}*/)
            .pipe(concat("mojo.js"))
            .pipe(gulp.dest(config.dist_dir))
            .pipe(concat("mojo.min.js"))
            .pipe(gulp.dest(config.dist_dir))
            .pipe(uglify())
            .pipe(gulp.dest(config.dist_dir)),
         
      gulp.src(config.mojoless)
            .pipe(concat("mojo.less"))
            .pipe(gulp.dest(config.dist_dir))
   );
}));


gulp.task("copy-files", gulp.series("build", function(cb) {
   var example = getExample();   
   return mergestream(
      gulp.src(config.dist_dir + "mojo.js")
            .pipe(gulp.dest(example + "/src/www/libs")),
   
      gulp.src(config.dist_dir + "mojo.less")
            .pipe(gulp.dest(example + "/src/www/less"))
   );
}));


gulp.task("build-example", gulp.series("copy-files", function() {
   var example = getExample();
 
   return gulp.src(example + "/src/www/less/app.less")
         // .pipe(debug({verbose: true}))
         .pipe(less())
         // .pipe(debug({verbose: true}))
         .pipe(gulp.dest(example + "/src/web/css"));
}));


gulp.task("server", function() {
   connect.server({
      root: "examples",
      port: 9000
   });
});