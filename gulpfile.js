// require("@babel/register");

const gulp = require('gulp');
const del = require('del');
const tslint = require('gulp-tslint');

const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const ts = require('gulp-typescript');
const jasmine = require('gulp-jasmine');

gulp.task('del', () => {
    return (async () => {
        await del(['built/**']);
    })();
});

gulp.task('tslint', () => {
    return gulp.src('src/**', '!src/itvdn_lessons/**')
        .pipe(tslint({
            formatter: 'verbose'
        }))
        .pipe(tslint.report());
});

gulp.task('compile', () => {
    return gulp.src('src/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(ts({
            noImplicitAny: true,
            // outFile: 'output.js',
            // module: 'system'
        }))
        // ?? why we need babel ??
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest('built/local'));
});

gulp.task('jasmine', () => {
    return gulp.src('built/**/*[sS]pec.js')
        .pipe(jasmine())
});

// gulp.task('all', gulp.series(['del', 'tslint', 'compile', 'jasmine']));

// gulp.task('default', gulp.series(['all']));
gulp.task('default', gulp.series(['del', 'tslint', 'compile', 'jasmine']));

// gulp.task('default', mock => { // empty task
//     mock();
// });
