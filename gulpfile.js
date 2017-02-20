/**
 * @license
 * Copyright 2016 The Lovefield Project Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const chalk = require('chalk');
const spawn = require('child_process').spawn;
const diff = require('diff');
const fs = require('fs-extra');
const gulp = require('gulp');
const change = require('gulp-change');
const format = require('gulp-clang-format').format;
const debug = require('gulp-debug');
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');
const transform = require('gulp-transform');
const tslint = require('gulp-tslint');
const tsc = require('gulp-typescript');
const merge = require('merge2');
const nopt = require('nopt');
const path = require('path');
const thru = require('through2');

const Files = {
  LIB: 'lib/**/*.ts',
  SPEC: 'example/spec/*.ts',
  TESTING: 'testing/**/*.ts',
  TESTS: 'tests/**/*.ts'
};
const Dir = {
  DEF: 'def',
  DIST: 'dist',
  LIB: 'lib',
  OUTPUT: 'out',
  SPEC: 'example/spec',
  TESTING: 'testing',
  TESTS: 'tests'
};
const TSCONFIG = 'tsconfig.json';

function releaseFilter(contents) {
  const START_TOKEN = '/// #if DEBUG';
  const END_TOKEN = '/// #endif';
  let data = contents;
  if (contents.includes(START_TOKEN)) {
    let lines = contents.split('\n');
    let includeLine = true;
    data = lines.filter((line) => {
      if (line.includes(START_TOKEN)) {
        includeLine = false;
      } else if (line.includes(END_TOKEN)) {
        includeLine = true;
      }
      return includeLine;
    }).join('\n');
  }
  return data;
}

function doBuild(srcs, defs, outs, filter, override) {
  let tsProject = tsc.createProject(TSCONFIG, override);
  let tsResult = gulp.src(srcs)
      .pipe(transform(filter, {encoding: 'utf8'}))
      .pipe(sourcemaps.init())
      .pipe(debug())
      .pipe(tsProject(tsc.reporter.defaultReporter()))
      .on('error', (err) => { process.exit(1); });
  return merge([
    tsResult.dts.pipe(gulp.dest(defs)),
    tsResult.js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(outs))
  ]);
}

function getFilter() {
  let knownOpts = {
    'mode': ['debug', 'release'],
  };
  let opts = nopt(knownOpts, null, process.argv, 2);
  return (opts.mode == 'release') ? releaseFilter : (x) => x;
}

function build(srcs, defs, outs) {
  let filter = getFilter();
  doBuild(srcs, defs, outs, filter, {});
}

function prettyPrint(patch) {
  if (patch.hunks.length) {
    console.log(chalk.yellow('===== ' + patch.oldFileName));
    patch.hunks.forEach((hunk) => {
      let numberOld = hunk.oldStart;
      let numberNew = hunk.newStart;
      hunk.lines.forEach((line) => {
        if (line[0] == '-') {
          console.log(chalk.bgRed(numberOld + ' ' + line));
          numberOld++;
        } else if (line[0] == '+') {
          console.log(chalk.bgGreen(numberNew + ' ' + line));
          numberNew++;
        } else {
          console.log(numberOld + ' ' + line);
          numberOld++;
          numberNew++;
        }
      });
    });
    console.log();
  }
}

function checkFormat() {
  let stream = thru.obj(function(file, enc, done) {
    if (file.isBuffer()) {
      let original = fs.readFileSync(file.path, 'utf8');
      let formatted = file.contents.toString();
      let patch = diff.structuredPatch(file.path, null, original, formatted);
      prettyPrint(patch);
    } else {
      console.error('Not supported');
      process.exit(1);
    }

    // Make sure the file goes through the next gulp plugin.
    this.push(file);
    done();
  });
  return stream;
}

gulp.task('default', () => {
  let log = console.log;
  log('Usage:');
  log('gulp build: build all libraries and tests');
  log('gulp clean: remove all intermediate files');
  log('gulp debug: run mocha debug');
  log('gulp dist: create dist package');
  log('gulp gen: generate and validate spec examples');
  log('gulp test: run mocha tests');
  log('gulp format_check: check files against clang-format')
  log('gulp lint: run tslint against code');
  log('');
  log('Options:');
  log('  --grep <pattern>: Mocha grep, can be used with debug/dev_test/test');
  log('  --mode <debug|release>: Choose build mode');
});

gulp.task('build_lib', () => {
  build(Files.LIB,
      path.join(Dir.OUTPUT, Dir.DEF),
      path.join(Dir.OUTPUT, Dir.LIB));
});

gulp.task('build_testing', () => {
  build(Files.TESTING,
      path.join(Dir.OUTPUT, Dir.DEF),
      path.join(Dir.OUTPUT, Dir.TESTING));
});

gulp.task('build_tests', ['build_lib', 'build_testing'], () => {
  build(Files.TESTS,
      path.join(Dir.OUTPUT, Dir.DEF),
      path.join(Dir.OUTPUT, Dir.TESTS));
});

gulp.task('format_check', () => {
  gulp.src([Files.LIB, Files.TESTS, Files.SPEC])
      .pipe(format())
      .pipe(checkFormat());
});

function handleIntermediate(content) {
  const START_TOKEN = '///// @@start';
  const END_TOKEN = '///// @@end';
  const SKIP_TOKEN = 'exports.';
  let lines = content.split('\n');
  let started = false;
  let ended = false;
  let results = lines.filter(line => {
    if (ended) return false;
    if (!started) {
      if (line.startsWith(START_TOKEN)) {
        started = true;
      }
      return false;
    }
    if (line.startsWith(END_TOKEN)) {
      ended = true;
      return false;
    }
    return true;
  });
  return results
      .map(line => {
        return line.startsWith(SKIP_TOKEN) ? '' : line;
      })
      .join('\n');
}

gulp.task('gen', () => {
  let tsProject = tsc.createProject(TSCONFIG, {
    "declaration": false,
    "removeComments": false
  });
  gulp.src(Files.SPEC)
      .pipe(debug())
      .pipe(tsProject(tsc.reporter.defaultReporter()))
      .on('error', (err) => { process.exit(1); })
      .js
      .pipe(change(handleIntermediate))
      .pipe(gulp.dest(path.join(Dir.OUTPUT, Dir.SPEC)));
});

gulp.task('lint', () => {
  gulp.src([Files.LIB, Files.TESTS, Files.SPEC])
      .pipe(tslint({formatter: 'stylish'}))
      .pipe(tslint.report({
        summarizeFailureOutput: true
      }));
});

gulp.task('build', ['build_tests'], () => {
});

gulp.task('dist', () => {
  let cwd = process.cwd();
  let targetLib = path.resolve(path.join(__dirname, Dir.OUTPUT, Dir.LIB));
  let targetDef = path.resolve(path.join(__dirname, Dir.OUTPUT, Dir.DEF));
  process.chdir(path.resolve(__dirname, Dir.DIST));
  if (!fs.existsSync(Dir.LIB)) {
    fs.symlinkSync(targetLib, Dir.LIB);
  }
  if (!fs.existsSync(Dir.DEF)) {
    fs.symlinkSync(targetDef, Dir.DEF);
  }
  process.chdir(cwd);
});

function getGrepPattern() {
  let knownOpts = { 'grep': String };
  let opts = nopt(knownOpts, null, process.argv, 2);
  return opts.grep ? opts.grep : undefined;
}

gulp.task('test', () => {
  let mochaOptions = {
    reporter: 'spec',
    require: ['source-map-support/register'],
    grep: getGrepPattern()
  };

  gulp.src('out/tests/**/*.js', {read: false})
      .pipe(mocha(mochaOptions));
});

gulp.task('debug', () => {
  let grepPattern = getGrepPattern();
  let nodeDebug = 'node';
  let mochaCmd =
      path.resolve(__dirname, 'node_modules/mocha/bin/mocha');
  let commandLine = [
      '--inspect',
      mochaCmd,
      'debug',
      '--no-timeouts',
      '--require', '"source-map-support/register"',
      '--recursive', '"out/tests/**/*.js"'];
  if (grepPattern) {
    commandLine.push('--grep');
    commandLine.push(grepPattern);
  }

  console.log('Run this command line in your shell:');
  console.log('node', commandLine.join(' '));
});

gulp.task('clean', () => {
  fs.removeSync(Dir.OUTPUT);
});
