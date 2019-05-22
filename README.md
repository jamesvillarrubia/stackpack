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

