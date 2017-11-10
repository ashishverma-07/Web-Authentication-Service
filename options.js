#!/usr/bin/env nodejs
'use strict';

const assert = require('assert');
const path = require('path');
const process = require('process');

const minimist = require('minimist')

const https = require('https');
const express = require('express');
const app = express();
var fs = require("fs");


const mongo = require('mongodb').MongoClient;
const users = require('./model/users');
const model = require('./model/model');
const server = require('./server/server');

const DB_URL = 'mongodb://localhost:27017/users';


const OPTS = [
  ['t', 'auth-time' ],
  ['d', 'ssl-dir' ]
];

const DEFAULT_AUTH_TIMEOUT = 300;
const DEFAULT_SSL_DIR = '.';

function usage(prg) {
  const opts = OPTS.map(function(opt) {
    const value = opt[1].replace('-', '_').toUpperCase();
    return `[ -${opt[0]}|--${opt[1]} ${value} ]`
  });
  console.error(`usage: ${path.basename(prg)} ${opts.join(' ')} PORT`);
  process.exit(1);
}

function getOptions(argv) { 
  const opts0 = OPTS.reduce((a, b) => a.concat(b), []);
  const opts = minimist(argv.slice(2));
  if (opts._.length !== 1) usage(argv[1]);
  for (let k of Object.keys(opts)) {
    if (k === '_') continue;
    if (opts0.indexOf(k) < 0) {
      console.error(`bad option '${k}'`);
      usage(argv[1]);getOptionsgetOptions
    }
  }
  return {
    port: opts._[0],
    authTimeout: opts.t || opts['auth-time'] || DEFAULT_AUTH_TIMEOUT,
    sslDir: opts.d || opts['ssl-dir'] || DEFAULT_SSL_DIR
  };
}

module.exports = {
  options: getOptions(process.argv)
};

if (!module.parent) {
  console.log(getOptions(process.argv));
}

const optsCmd = getOptions(process.argv);
const port = optsCmd.port;
const sslDir = optsCmd.sslDir;
const authTime = optsCmd.authTimeout;
console.log(sslDir);

let KEY_PATH;
let CERT_PATH;
KEY_PATH = sslDir + "/key.pem";
CERT_PATH = sslDir + "/cert.pem";

https.createServer({
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH),
}, app).listen(port);

mongo.connect(DB_URL).
    then(function (db) {
    const model1 = new model.Model(db);
    server.serve(app,port,model1,authTime);
   }).
  catch((e) => console.error(e));
