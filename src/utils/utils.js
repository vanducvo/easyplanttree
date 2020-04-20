const settings = require('../config/settings');
const winston = require('winston');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const compare = require('tsscmp');

function createTextResepondJSONBeaufy(json) {
  return JSON.stringify(json, null, '\t');
}

const customFormat = winston.format.printf(
    function({level, message, label, timestamp}) {
      return `${timestamp} [${label}] ${level}: ${message}`;
    },
);

function logFile(name) {
  return path.join(settings.logFolder, name);
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: logFile('debug_error.log'),
      level: 'error',
    }),
  ],
  format: winston.format.combine(
      winston.format.label({label: 'Middleware'}),
      winston.format.timestamp(),
      customFormat,
  ),
});

const serverErrorLogger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: logFile('server_error.log'),
      level: 'error',
    }),
  ],

  format: winston.format.combine(
      winston.format.label({label: 'Server Error'}),
      winston.format.timestamp(),
      customFormat,
  ),
});

function promiseScrypt (data){
  return new Promise((resolve, reject) => {
    crypto.scrypt(data, settings.cryto_secretkey, 64, function(err, key){
      if(err)
        reject(err);
      
      resolve(key.toString('hex'));
    });
  });
}

function promiseVerifyScrypt(origindata, data){
  return promiseScrypt(origindata).then(key => {
    return compare(data, key);
  });
}

function jwtCreate(data, limit){
  return jwt.sign(data, settings.jwt_secretkey);
}

function jwtVerify(data){
  return new Promise((resolve, reject) => {
    jwt.verify(data, settings.jwt_secretkey, function(err, decoded){
      if(err)
        reject(err);
      
      resolve(decoded);
    });
  })
}

exports.createTextResepondJSONBeaufy = createTextResepondJSONBeaufy;
exports.logger = logger;
exports.serverErrorLogger = serverErrorLogger.error.bind(serverErrorLogger);
exports.promiseScrypt = promiseScrypt;
exports.jwtCreate = jwtCreate;
exports.jwtVerify = jwtVerify;
exports.promiseVerifyScrypt = promiseVerifyScrypt;