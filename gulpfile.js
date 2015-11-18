(function () {

  /* globals require, console */

  'use strict';

  var gulp = require('gulp');
  var $ = require('gulp-load-plugins')();
  var del = require('del');
  var runSequence = require('run-sequence');
  var browserSync = require('browser-sync');
  var reload = browserSync.reload;

  // Clean output directory
  gulp.task('clean', function (cb) {
    del(['dist', 'src/ree.vulcanized.html'], cb);
  });

  // Clean output directory
  gulp.task('clean-vulcanized', function (cb) {
    del(['src/ree.vulcanized.html'], cb);
  });

  gulp.task('copy', function (cb) {
    gulp.src(['src/ree.html'])
    .pipe($.rename('ree.vulcanized.html'))
    .pipe(gulp.dest('src'))
    .on('end', cb);
  });

  // Vulcanize granular configuration
  gulp.task('vulcanize', function () {
    var DEST_DIR = 'dist';
    return gulp.src('src/ree.vulcanized.html')
      .pipe($.vulcanize({
        stripComments: true,
        inlineCss: true,
        inlineScripts: true
      }))
      .on('error', function(e) {
        console.log(e)
      })
      .pipe($.rename('ree.html'))
      .pipe($.minifyInline())
      .pipe($.crisper({
        scriptInHead: false, // true is default
        onlySplit: false
      }))
      .pipe(gulp.dest(DEST_DIR))
      .pipe($.size({title: 'vulcanize'}));
  });

  // Lint JavaScript
  gulp.task('lint', function() {
    return gulp.src([
      'src/**/*.js',
      'src/**/*.html',
      ])
      .pipe(reload({
        stream: true,
        once: true
      }))

    // JSCS has not yet a extract option
    .pipe($.if('*.html', $.htmlExtract()))
    .pipe($.jshint())
    .pipe($.jscs())
    .pipe($.jscsStylish.combineWithHintResults())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
  });

  gulp.task('watch', function () {

    gulp.watch([
      'src/**/*.js',
      'src/**/*.html',
      '!src/ree.vulcanized.html'],
    ['build']);

    runSequence('build');

  });

  gulp.task('build', function (cb) {
    runSequence(
      'lint',
      'clean',
      'copy',
      'vulcanize',
      'clean-vulcanized',
      cb
    );
  });

  // Build production files, the default task
  gulp.task('default', ['build']);

}());
