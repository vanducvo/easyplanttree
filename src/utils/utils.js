const settings = require('../config/settings');
const winston = require('winston');
const path = require('path');

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


exports.createTextResepondJSONBeaufy = createTextResepondJSONBeaufy;
exports.logger = logger;
exports.serverErrorLogger = serverErrorLogger.error.bind(serverErrorLogger);
