# Relational Database Specification Polyfill

This repo provides a polyfill of
[specification](https://github.com/arthurhsu/rdb).

## Why TypeScript?

The authors need a fast tool to develop polyfill, and thus TypeScript is
chosen. The end product is still in ES6, located under `dist/` directory
(You need to call `gulp build` to generate the `dist/` directory).

## How to Build It?

```bash
npm install -g gulp
npm install
gulp
```

Supported command line and options will be listed in the gulp command.

## What's the Supported Browser?

* Node module that features SQLite3 native code
  * Very limited support for `ALTER TABLE`
  * Temporarily using node-sqlite3 underneath, no support of observers.

Other options considered:

* ~~Chrome WebSQL polyfill~~ This is no-go.
  * WebSQL does not support `BEGIN`, `COMMIT` and `ROLLBACK`
  * WebSQL transaction callback is not chainable with other asynchronous calls:
    it will automatically commit.
* Electron
  * Eventually we'd like to build a proof-of-concept using Electron and show
    the power of native C++ bindings.

## Is this Compatible with Lovefield?

Sort of. Some APIs have changed since we are no longer constrainted by
IndexedDB. Major change is in the syntax of search condition and database
schema change. There are fewer aggregate functions supported due to
underlying SQL engine support.

Observers are greatly simplified because the original observer design in
Lovefield provides detailed information than needed in most cases.

## How to Use It?

See `example/` for JavaScript (Node.js) usage.

## How to Debug the Code?

Debugging with TypeScript+Mocha+Node.js (especially Node.js 7.x) is very tricky.
The easiest way to do this is to use VSCode as your editor, then add this
launch config to your Debug settings:

```json
"configurations": [
    {
      "name": "Run Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceRoot}/node_modules/mocha/bin/_mocha",
      "args": [
        "-u", "tdd",
        "--no-timeouts",
        "--colors",
        "${workspaceRoot}/out/**/*.js"
      ],
      "cwd": "${workspaceRoot}",
      "runtimeExecutable": null,
      "runtimeArgs": [
        "--nolazy"
      ],
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true,
      "outFiles": [
        "${workspaceRoot}/out/lib/**/*.js",
        "${workspaceRoot}/out/testing/**/*.js",
        "${workspaceRoot}/out/tests/**/*.js"
      ]
    }
  ]
```

To put a breakpoint, you MUST put them on `out/**/*.js` instead of TypeScript
file. Once the breakpoint is hit, it's the TypeScript file that will be used
for stepping and debugging.
