var gulp = require("gulp");
var tslint = require("gulp-tslint");
var typescript = require("gulp-typescript");
var tsProject = typescript.createProject('tsconfig.json');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var del = require('del');

var shell = require('gulp-shell');

gulp.task('build',  runTsc)
gulp.task('rebuild', ['tslint'], runTsc)

gulp.task('clear-js', function(cb) {
    return del(['**/*.js', '**/*.js.map', '!gulpfile.js', '!node_modules/**/*.*', '!typings/**/*.*'], cb);
});

gulp.task('tslint', ['clear-js'], function () {
	return gulp.src(['**/*.ts', '!node_modules/**/*.ts', '!typings/**/*.ts'])
		.pipe(tslint())
		.pipe(tslint.report('verbose'));
})

function runTsc() {
    return tsProject.src()
		.pipe(sourcemaps.init())
        .pipe(typescript(tsProject)).js
		.pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: __dirname }))
		.pipe(gulp.dest('.'));     
}