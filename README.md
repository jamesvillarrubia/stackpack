# STACKPACK

[![Build Status](https://travis-ci.org/jamesvillarrubia/stackpack.svg?branch=master)](https://travis-ci.org/jamesvillarrubia/stackpack) [![dependencies Status](https://david-dm.org/jamesvillarrubia/stackpack/status.svg)](https://david-dm.org/jamesvillarrubia/stackpack) [![devDependencies Status](https://david-dm.org/jamesvillarrubia/stackpack/dev-status.svg)](https://david-dm.org/jamesvillarrubia/stackpack?type=dev) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## PREREQUISITES

This module assumes a few things:

1. You are using AWS for your deployments and caching
2. You are deploying a create-react-app app and building with react-scripts
3. You have a default aws profile (secret keys) configured for your terminal or bash.  You can alter the name of the default profile in the package.json under stackpack config with ```profile: "profile-name"```.  This profile should have permissions on S3 and Cloudfront.
4. You have added the domain name you want to use to route53 and, if using your own cert, have created that cert and ARN
5. You have installed Docker.


## Quickstart
```
npx create-react-app test-stack
cd test-stack
npm install --save-dev stackpack
``` 


## Getting started / Installation

1. ```git branch develop``` (may already exist)
2. ```npm install -g stackpack```
3. ```stackpack init s3-cf-https```
4. Open up package.json and edit the stackpack section.  Change the domain name to your domain of choice. Change the aws profile name if necessary. 
5. ```stackpack cf setup```
6. Run the following commands for your respective env
   ```
   npm run deploy:develop
   ``` 
   or
   ```
   stackpack build --env develop; stackpack deploy --env develop; stackpack cf invalidate --env develop
   ```


## How it works

Stackpack setups a standard set of deployment packages that combine very common tools (cra, serverless, gitlab) with git related branches (develop, qa, staging, prod) onto a series of common devops assets (S3, cloudfront, route53, beanstalk, lambda).

This means that you can go from create-react-app to a deployed, cloudfront-cached, S3-hosted app in under 2 minutes (not counting cloudfront roll out time).

## Why?

Every time I built a new mvp application, I was always copying and pasting the same deployment scripts. This essentially just bundles them all up into various templates so that the interface to the end user is very, very simple.  This removes the need for a lot of devops for small projects, and get devops up and running for you.  Cloudformation can do some of this, but that can be complicated or overkill.  This is meant to be turn-key devops for small javascript project teams that don't want to dig deep into the various configuration tools (Serverless, Cloudformation, etc.), but do want a uniform deployment flow.

## Templates

_Note: Templates will not overwrite existing code or files, so if you need to reset, it's best to start over or remove the stackpack files, folder, and package.json options_

- ```stackpack init s3-cf-https```
  - uses S3 to host a create-react-app application.  It can be used for other SPAs
  - uses cloudfront to cache a subset of the environments
  - (optional) applies an ssl cert to your endpoints
- ```stackpack init s3-cf-https-gitlab```
  - same as s3-cf-https but includes a gitlab.com yml file for auto-deployment.  More predictable than using the raw docker form, but more difficult to debug.
- ```stackpack init gitflow```
  - Adds a standard git deployment flow with environments: develop, qa, staging, production/prod/master
  - See section *Using Gitflow*
- COMING ```stackpack init beanstalk``` (same api, with beanstalk guts and docker bundling)
- COMING ```stackpack init lambda``` (same api, with serverless guts and docker bundling)

  
## First deployment

Once you've run the ```init``` with the right template, you will run ```npm run deploy:develop``` to deploy the application.

## Options
  - *ssl* 
    - The arn of the ssl cert that you want to use with cloudfront
    - Example: arn:aws:acm:us-east-1:985732079875:certificate/XXXXXXXXXXXXXXXXX
  - *template*
    - The example 
    - Example: s3-cf-https
  - *profile*
    - Example: werk-admin
  - *domain* 
    - The domain that will be used in all cloudfront settings.  Make sure your cert complies with this domain (i.e. *.project.com)
    - Example: subproject.project.com
  - *environments*
    - An array of strings that will name your environment files
    - Example: ```["develop","qa","staging","prod"]```
  - *cf_envs*
    - An array of environments where cloudfront should be used.  Must be a subset of the environments array
    - Example: ```["staging","prod"]```
  - *rootenv*
    - The master environment, usually prod or production or master. Defaults to prod
    - Example: "prod"
  - *gitflow*
    - An object mapping environment names to branches in your git repo
    - Example:
    ```
    {
      "develop": "develop",
      "qa": "qa",
      "staging": "staging",
      "prod": "master"
    }
    ```


## Deployments

Dockerize
    - uses the local dockerfile to run a deployment

## Using Gitflow

If you decide to setup ```stackpack init gitflow``` you will see that several commands have been added to your package.json.  These are just commands, so nothing serious is being done to your stack or git without you seeing the full commands.  Before running this out-of-the-box, you should branch master into branches: develop, qa, staging.

1. ```npm run git:develop``` will add all changes to develop and prompt a commit message for your change
2. ```npm run git:qa``` will stash all changes on develop, switch to qa, merge develop, add a standard deployment message to the commit, switch back to develop, and unstash changes
3. ```npm run git:staging``` same as qa but merges from qa into staging
4. ```npm run git:prod``` same as qa but merges from staging into master.  It will prompt you for a versioning to tag the commit (patch, minor, major)


## Commands

- `npm run git:develop` - commit changes to develop and push
- `npm run git:ENV` - stash changes, merge preceeding branch to ENV, push, checkout develop, unstash changes, also works on other environments
- `npm run deploy:develop` - deploys the develop branch via the templat inside docker
- `npm run deploy:ENV` - same as develop, but for the ENV branch
- `stackpack init TEMPLATE` - creates template files and sets up commands
- `stackpack build --env ENV --profile AWS_PROFILE` - builds the app and stores by environment in the .stackpack/builds folder
- `stackpack deploy --env ENV --profile AWS_PROFILE` - takes the .stackpack/builds folder and deploys the latest version to S3
- `stackpack cf refresh --env ENV --profile AWS_PROFILE` - pulls the cloudfront config for that environment and stores it locally for examination or modification
- `stackpack cf setup --env ENV --profile AWS_PROFILE` - creates cloudfront configs for the environments specified in packages.json cf_envs
- `stackpack cf update --env ENV --profile AWS_PROFILE` - pushes the local cloudfront config (with your updates) to cloudfront.
- `stackpack cf invalidate --env ENV --profile AWS_PROFILE` - creates a full /* invalidation for the env specified
- INTERNAL `stackpack cf get --env ENV --profile AWS_PROFILE` - fetches the config by domain, intended for internal use and may be deprecated later
- INTERNAL `stackpack cf create --env ENV --profile AWS_PROFILE` - creates a default config by env and domain, intended for internal use and may be deprecated later
