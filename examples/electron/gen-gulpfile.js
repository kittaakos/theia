const gulp = require('gulp');

const ts = require('gulp-typescript');
const typescript = require('typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const es = require('event-stream');
const nls = require('vscode-nls-dev');

const tsProject = ts.createProject('./tsconfig.json', { typescript });

const inlineMap = true;
const inlineSource = false;
const outDest = 'lib';

const languages = [];

const cleanTask = function() {
    return del(['package.nls.*.json']);
};

const internalCompileTask = function() {
    return doCompile(false);
};

const internalNlsCompileTask = function() {
    return doCompile(true);
};

const addI18nTask = function() {
    return gulp.src(['package.nls.json'])
        .pipe(nls.createAdditionalLanguageFiles(languages, 'i18n'))
        .pipe(gulp.dest('.'));
};

const buildTask = gulp.series(cleanTask, internalNlsCompileTask, addI18nTask);

const doCompile = function (buildNls) {
    var r = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject()).js
        .pipe(buildNls ? nls.rewriteLocalizeCalls() : es.through())
        .pipe(buildNls ? nls.createAdditionalLanguageFiles(languages, 'i18n', outDest) : es.through());

    if (inlineMap && inlineSource) {
        r = r.pipe(sourcemaps.write());
    } else {
        r = r.pipe(sourcemaps.write("../" + outDest, {
            // no inlined source
            includeContent: inlineSource,
            // Return relative source map root directories per file.
            sourceRoot: "../src"
        }));
    }

    return r.pipe(gulp.dest(outDest));
};

gulp.task('default', gulp.series(cleanTask, internalCompileTask));
gulp.task('compile', gulp.series(cleanTask, internalCompileTask));
gulp.task('build', buildTask);
gulp.task('clean', cleanTask);

module.exports = { gulp, languages };
