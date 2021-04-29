/********************************************************************************
 * Copyright (C) 2021 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import * as fs from 'fs-extra';
import { AbstractGenerator } from './abstract-generator';

export class GulpGenerator extends AbstractGenerator {

    async generate(): Promise<void> {
        await this.write(this.genGulpFilePath, this.compileGulpFile());
        if (await this.shouldGenerateUserGulpFile()) {
            await this.write(this.gulpFilePath, this.compileUserGulpFile());
        }
    }

    protected async shouldGenerateUserGulpFile(): Promise<boolean> {
        if (!(await fs.pathExists(this.gulpFilePath))) {
            return true;
        }
        const content = await fs.readFile(this.gulpFilePath, 'utf8');
        return content.indexOf('gen-webpack') === -1;
    }

    get gulpFilePath(): string {
        return this.pck.path('gulpfile.js');
    }

    get genGulpFilePath(): string {
        return this.pck.path('gen-gulpfile.js');
    }

    compileGulpFile(): string {
        return `const gulp = require('gulp');

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
`;
    }

    compileUserGulpFile(): string {
        return `const { gulp, languages } = require('./gen-gulpfile');

// Do your gulpfile customization here.
// For example, call \`languages.push({ folderName: 'jpn', id: 'ja' });\` to add support for the Japanese locale.
// See https://github.com/microsoft/vscode-extension-samples/tree/main/i18n-sample for more implementation details.

module.exports = { gulp, languages };
`;
    }

}
