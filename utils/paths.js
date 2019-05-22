// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

const envPublicUrl = process.env.PUBLIC_URL;

function ensureSlash(inputPath, needsSlash) {
  const hasSlash = inputPath.endsWith('/');
  if (hasSlash && !needsSlash) {
    return inputPath.substr(0, inputPath.length - 1);
  } else if (!hasSlash && needsSlash) {
    return `${inputPath}/`;
  } else {
    return inputPath;
  }
}

// config after eject: we're in ./config/
module.exports = {
//   dotenv: resolveApp('.env'),
//   appPath: resolveApp('.'),
//   appBuild: resolveApp('build'),
//   appPublic: resolveApp('public'),
//   appHtml: resolveApp('public/index.html'),
//   appPackageJson: resolveApp('package.json'),
//   appSrc: resolveApp('src'),
//   appTsConfig: resolveApp('tsconfig.json'),
//   appJsConfig: resolveApp('jsconfig.json'),
//   yarnLockFile: resolveApp('yarn.lock'),
//   proxySetup: resolveApp('src/setupProxy.js'),
//   appNodeModules: resolveApp('node_modules'),
//   publicUrl: getPublicUrl(resolveApp('package.json')),
//   servedPath: getServedPath(resolveApp('package.json')),
//   resolveOwn,
  resolveApp,
//   resolveFn
};

// @remove-on-eject-begin
const resolveOwn = relativePath => path.resolve(__dirname, '..', relativePath);
