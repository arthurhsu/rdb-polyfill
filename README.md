# Relational Database Specification Polyfill

This repo provides a polyfill of
[specification](https://github.com/arthurhsu/rdb).

## Why TypeScript?

The authors need a fast tool to develop polyfill, and thus TypeScript is
chosen. The end product is still in ES6, located under `dist/` directory.

## How to Build It?

```bash
npm install
gulp
```

Supported command line and options will be listed in the gulp command.

## How to Use It?

The final compiled ES6 script is located at `dist/rdb.js`.

## What's the Supported Browser?

Currently we only plan to support Chrome, since this is a polyfill. We plan
to use deprecated WebSQL underneath to demonstrate the concept.

## Is this Compatible with Lovefield?

Mostly. Some APIs have changed since we are no longer constrainted by
IndexedDB.
