# Relational Database Specification Polyfill

This repo provides a polyfill of
[specification](https://github.com/arthurhsu/rdb).

## Why TypeScript?

The authors need a fast tool to develop polyfill, and thus TypeScript is
chosen. The end product is still in ES6, located under `dist/` directory.

## How to Build It?

```bash
npm install -g gulp
npm install
gulp
```

Supported command line and options will be listed in the gulp command.

## How to Use It? What's the Supported Browser?

Still evaluating two different options:
* Node module that features SQLite3 native code
  * Very limited support for `ALTER TABLE`
  * Temporarily using node-sqlite3 underneath, no support of observers.
* ~~Chrome WebSQL polyfill~~
  * WebSQL does not support `BEGIN`, `COMMIT` and `ROLLBACK`
  * WebSQL transaction callback is not chainable with other asynchronous calls:
    it will automatically commit.

## Is this Compatible with Lovefield?

Mostly. Some APIs have changed since we are no longer constrainted by
IndexedDB. Major change is in the syntax of search condition and database
schema change.
