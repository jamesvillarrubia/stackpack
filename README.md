# STACKPACK

## Introduction

## Getting started / Installation

First
```npm install -g stackpack```

Then
```stackpack init s3-cf-https```

## How it works

Stackpack setups a standard set of deployment packages that combine very common tools (cra, serverless, gitlab) with git related branches (develop,qa,staging,prod) onto a series of common devops assets (S3, cloudfront, route53, beanstalk, lambda).

This means that you can go from create-react-app to a deployed, cloudfront-cached, S3-hosted app in under 2 minutes (not counting cloudfront roll out time).

## Why?

Every time I built a new mvp application, I was always copying and pasting the same deployment scripts. This essentially just bundles them all up into various templates so that the interface to the end user is very, very simple.  This removes the need for a lot of devops for small projects, but get devops up and running for you.


## Templates

s3-cf-https
    - uses S3 to host a create-react-app application.  It can be used for other SPAs
    - uses cloudfront to cache a subset of the environments
    - (optional) applies an ssl cert to your endpoints
    - Deployment options: `dockerize` or `raw`
      - dockerize: run a local dockerfile to upload to s3
      - raw: build locally and copy from that

## Deployments

Dockerize
    - uses the local dockerfile to run a deployment



# NPM Module Boilerplate

[![Build Status](https://travis-ci.org/jamesvillarrubia/stackpack.svg?branch=master)](https://travis-ci.org/jamesvillarrubia/stackpack) [![dependencies Status](https://david-dm.org/jamesvillarrubia/stackpack/status.svg)](https://david-dm.org/jamesvillarrubia/stackpack) [![devDependencies Status](https://david-dm.org/jamesvillarrubia/stackpack/dev-status.svg)](https://david-dm.org/jamesvillarrubia/stackpack?type=dev) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Start developing your NPM module in seconds** ✨

Readymade boilerplate setup with all the best practices to kick start your npm/node module development.

Happy hacking =)

# Features

* **ES6/ESNext** - Write _ES6_ code and _Babel_ will transpile it to ES5 for backwards compatibility
* **Test** - _Mocha_ with _Istanbul_ coverage
* **Lint** - Preconfigured _ESlint_ with _Airbnb_ config
* **CI** - _TravisCI_ configuration setup
* **Minify** - Built code will be minified for performance

# Commands
- `npm run clean` - Remove `lib/` directory
- `npm test` - Run tests with linting and coverage results.
- `npm test:only` - Run tests without linting or coverage.
- `npm test:watch` - You can even re-run tests on file changes!
- `npm test:prod` - Run tests with minified code.
- `npm run test:examples` - Test written examples on pure JS for better understanding module usage.
- `npm run lint` - Run ESlint with airbnb-config
- `npm run cover` - Get coverage report for your code.
- `npm run build` - Babel will transpile ES6 => ES5 and minify the code.
- `npm run prepublish` - Hook for npm. Do all the checks before publishing your module.

# Installation
Just clone this repo and remove `.git` folder.


# License

MIT © Dinesh Pandiyan


