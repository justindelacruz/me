const gulp = require('gulp');
const sass = require('gulp-sass');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const util = require('gulp-util');

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
const dependencies = [
  'react',
  'react-dom'
];

// keep a count of the times a task refires
let scriptsCount = 0;

gulp.task('sass', function () {
  return gulp.src('./src/sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./static/css'));
});

gulp.task('sass:watch', function () {
  gulp.watch('./src/sass/**/*.scss', ['sass']);
});

gulp.task('js', function () {
  bundleApp(false);
});

gulp.task('js:deploy', function (){
  bundleApp(true);
});

gulp.task('js:watch', function () {
  return gulp.watch(['./src/js/**/*.js', './src/js/**/*.json'], ['js']);
});

gulp.task('default', ['sass', 'sass:watch', 'js', 'js:watch']);


/**
 * @param isProduction
 * @link  http://jpsierens.com/tutorial-gulp-javascript-2015-react/
 */
function bundleApp(isProduction) {
  scriptsCount++;
  // Browserify will bundle all our js files together in to one and will let
  // us use modules in the front end.
  var appBundler = browserify({
    entries: './src/js/app.js',
    debug: true
  });

  // If it's not for production, a separate vendors.js file will be created
  // the first time gulp is run so that we don't have to rebundle things like
  // react everytime there's a change in the js file
  if (!isProduction && scriptsCount === 1){
    // create vendors.js for dev environment.
    browserify({
      require: dependencies,
      debug: true
    })
      .bundle()
      .on('error', util.log)
      .pipe(source('vendors.js'))
      .pipe(gulp.dest('./static/js/'));
  }
  if (!isProduction){
    // make the dependencies external so they dont get bundled by the
    // app bundler. Dependencies are already bundled in vendor.js for
    // development environments.
    dependencies.forEach(function(dep){
      appBundler.external(dep);
    })
  }

  appBundler
  // transform ES6 and JSX to ES5 with babelify
    .transform("babelify", {presets: ["es2015", "react"]})
    .bundle()
    .on('error',util.log)
    .pipe(source('app.js'))
    .pipe(gulp.dest('./static/js/'));
}