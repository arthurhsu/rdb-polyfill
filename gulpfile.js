const chalk = require('chalk');
const diff = require('diff');
const fs = require('fs-extra');
const gulp = require('gulp');
const format = require('gulp-clang-format').format;
const debug = require('gulp-debug');
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');
const transform = require('gulp-transform');
const tslint = require('gulp-tslint');
const tsc = require('gulp-typescript');
const typings = require('gulp-typings');
const karma = require('karma');
const merge = require('merge2');
const nopt = require('nopt');
const path = require('path');
const thru = require('through2');

const Files = {
  LIB: 'lib/**/*.ts',
  TESTING: 'testing/**/*.ts',
  TESTS: 'tests/**/*.ts'
};
const TYPINGS_INDEX = 'typings/index.d.ts';
const Dir = {
  DEF: 'def',
  LIB: 'lib',
  OUTPUT: 'out',
  TESTING: 'testing',
  TESTS: 'tests',
  TYPINGS: 'typings'
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

function build(srcs, defs, outs) {
  let knownOpts = {
    'mode': ['debug', 'release']
  };
  let opts = nopt(knownOpts, null, process.argv, 2);
  let filter = (opts.mode == 'release') ? releaseFilter : (x) => x;

  let tsProject = tsc.createProject(TSCONFIG);
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
  var log = console.log;
  log('Usage:');
  log('gulp build: build all libraries and tests');
  log('gulp clean: remove all intermediate files');
  log('gulp debug: run a Karma server and wait for debug');
  log('gulp dev_test: run Mocha-only tests');
  log('gulp format_check: check files against clang-format')
  log('gulp lint: run tslint against code');
  log('gulp test: run tests using Karma');
  log('');
  log('Options:');
  log('  --grep <pattern>: Mocha grep, can be used with debug/dev_test/test');
  log('  --mode <debug|release>: Choose build mode');
});

gulp.task('typings', () => {
  if (fs.existsSync(Dir.TYPINGS)) {
    return;  // Already run
  }
  return gulp.src('typings.json')
      .pipe(typings());
});

gulp.task('build_lib', ['typings'], () => {
  return build(Files.LIB,
      path.join(Dir.OUTPUT, Dir.DEF),
      path.join(Dir.OUTPUT, Dir.LIB));
});

gulp.task('build_testing', ['typings'], () => {
  return build([Files.TESTING, TYPINGS_INDEX],
      path.join(Dir.OUTPUT, Dir.DEF),
      path.join(Dir.OUTPUT, Dir.TESTING));
});

gulp.task('build_tests', ['build_lib', 'build_testing'], () => {
  return build([Files.TESTS, TYPINGS_INDEX],
      path.join(Dir.OUTPUT, Dir.DEF),
      path.join(Dir.OUTPUT, Dir.TESTS));
});

gulp.task('format_check', () => {
  gulp.src([Files.LIB, Files.TESTS])
      .pipe(format())
      .pipe(checkFormat());
});

gulp.task('lint', () => {
  gulp.src([Files.LIB, Files.TESTS])
      .pipe(tslint({formatter: 'stylish'}))
      .pipe(tslint.report({
        summarizeFailureOutput: true
      }));
});

gulp.task('build', ['build_tests'], () => {
});

function getGrepPattern() {
  let knownOpts = { 'grep': String };
  let opts = nopt(knownOpts, null, process.argv, 2);
  return opts.grep ? opts.grep : undefined;
}

gulp.task('dev_test', ['build'], () => {
  let mochaOptions = {
    reporter: 'spec',
    require: ['source-map-support/register'],
    grep: getGrepPattern()
  };

  gulp.src('out/tests/**/*.js', {read: false})
      .pipe(mocha(mochaOptions));
});

gulp.task('clean', () => {
  fs.removeSync(Dir.OUTPUT);
  fs.removeSync(Dir.TYPINGS);
});

gulp.task('test', ['build'], (done) => {
  new karma.Server({
    configFile: path.join(__dirname, 'karma_config.js'),
    singleRun: true,
    client: { mocha: { grep: getGrepPattern() } }
  }, done).start();
});

gulp.task('debug', (done) => {
  new karma.Server({
    configFile: path.join(__dirname, 'karma_config.js'),
    singleRun: false,
    client: { mocha: { grep: getGrepPattern() } }
  }, done).start();
});
