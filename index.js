#!/usr/bin/env nodejs

'use strict';
//ashish verma
const DB_URL = 'mongodb://localhost:27017/users';

const mongo = require('mongodb').MongoClient;

const options = require('./options').options;
const server = require('./server/server');
const model = require('./model/model');

mongo.connect(DB_URL).
  then(function(db) {
    const model1 = new model.Model(db);
    server.serve(options, model1);
    //db.close();
  }).
  catch((e) => console.error(e));

