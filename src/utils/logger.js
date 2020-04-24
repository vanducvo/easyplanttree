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

/**
 * @description 
 * @param {Array.<winston.transports>} transports 
 * @param {string} label
 * @returns {(filemodule:Object) => winston} create logger function
 */
function createLogger(transports, label) {
    return function (filemodule) {
        let filename = path.basename(filemodule.filename)
        return winston.createLogger({
            transports,
            format: winston.format.combine(
                winston.format.label({ label }),
                winston.format.timestamp(),
                winston.format.printf(
                    function ({ level, message, label, timestamp }) {
                        return `${timestamp} [${filename}] [${label}] ${level}: ${message}`;
                    }
                )
            ),
            silent: label == 'Debug' && process.env.NODE_ENV == "production"
        });
    }
}

module.exports.debugLogger = createLogger([
    new winston.transports.Console(),
    new winston.transports.File({
        filename: logFile('debug.log'),
        level: 'error'
    })
], 'Debug');

module.exports.serverLogger = createLogger([
    new winston.transports.File({
        filename: logFile('server.log'),
        level: 'error'
    })
], 'Server');

module.exports.databaseLogger = createLogger([
    new winston.transports.File({
        filename: logFile('database.log'),
        level: 'error'
    })
], 'Database');

module.exports.hardwareLogger = createLogger([
    new winston.transports.File({
        filename: logFile('database.log'),
        level: 'error'
    })
], 'Hardware');