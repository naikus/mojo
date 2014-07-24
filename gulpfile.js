var gulp = require("gulp"),
      cliargs = require("yargs").argv,
      gulpif = require("gulp-if"),
      jshint = require("gulp-jshint"),
      clean = require("gulp-clean"),
      concat = require("gulp-concat"),
      uglify = require("gulp-uglify"),
      less = require("gulp-less"),
      debug = require("gulp-debug"),
      eventStream = require("event-stream"),
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
      "src/datalist/datalist.js",
      "src/form/form.js",
      "src/activables/activables.js",
      "src/tabstrip/tabstrip.js"
   ],
   
   mojoless: [
      "LICENSE",
      
      //"src/app/colors.less",
      "src/app/application.less",
      "src/app/base.less",

      "src/datalist/datalist.less",
      "src/form/form.less",
      "src/activables/activables.less",
      "src/tabstrip/tabstrip.less"
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
gulp.task("clean", function() {
   return gulp.src(config.dist_dir, {read: false})
         .pipe(clean({force: true}));
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
gulp.task("build", ["clean"], function() {
   // do other build things
   gulp.start("jshint");      
 
   return eventStream.merge(
      gulp.src(config.mojojs/*, {debug: true}*/)
            .pipe(concat("mojo.js"))
            .pipe(gulp.dest(config.dist_dir))
            .pipe(concat("mojo.min.js"))
            .pipe(gulp.dest(config.dist_dir))
            .pipe(uglify({comments: /^\/\*\!*/}))
            .pipe(gulp.dest(config.dist_dir)),
         
      gulp.src(config.mojoless)
            .pipe(concat("mojo.less"))
            .pipe(gulp.dest(config.dist_dir))
   );

});


gulp.task("copy-files", ["build"], function() {
   var example = getExample();
   
   return eventStream.merge(
      gulp.src(config.dist_dir + "mojo.js")
            .pipe(gulp.dest(example + "/src/web/js/lib")),
   
      gulp.src(config.dist_dir + "mojo.less")
            .pipe(gulp.dest(example + "/src/web/less"))
   );
 
});


gulp.task("build-example", ["copy-files"], function() {
   var example = getExample();
 
   gulp.src(example + "/src/web/less/app.less")
         // .pipe(debug({verbose: true}))
         .pipe(less())
         // .pipe(debug({verbose: true}))
         .pipe(gulp.dest(example + "/src/web/css"));
});


gulp.task("server", function() {
   connect.server({
      root: "examples",
      port: 9000
   });
});