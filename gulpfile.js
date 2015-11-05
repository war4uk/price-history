var gulp = require("gulp");
var tslint = require("gulp-tslint");
var typescript = require("gulp-typescript");
var tsProject = typescript.createProject('tsconfig.json');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');

var shell = require('gulp-shell');


gulp.task('tslint', function () {
	return gulp.src(['**/*.ts', '!node_modules/**/*.ts', '!typings/**/*.ts'])
		.pipe(tslint())
		.pipe(tslint.report('verbose'));
})
