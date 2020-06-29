const path = require('path');
const winston = require('winston');

/**
 * @description get name file of origin path
 * @param {string} name
 * @returns  {string} name of file
 */
function logFile(name) {
    return path.resolve('./logs', name);
}

let logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            silent: process.env.NODE_ENV == "production"
        }),
        new winston.transports.File({
            filename: logFile('debug.log'),
            level: 'error'
        })
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
            function ({ level, message, timestamp }) {
                return `${timestamp} ${level}: ${message}`;
            }
        )
    ),
});

/**
 * @description
 * @returns {(filemodule:Object) => winston} create logger function
 */
function createLogger() {
    return function () {
        return logger;
    }
}

module.exports.debugLogger = createLogger();

module.exports.serverLogger = createLogger();

module.exports.databaseLogger = createLogger();

module.exports.hardwareLogger = createLogger();