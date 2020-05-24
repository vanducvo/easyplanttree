const {jwtVerify} = require('../utils/utils');
const serverLogger = require('../utils/logger').serverLogger(module);
const databaseLogger = require('../utils/logger').databaseLogger(module); 
const Tokens = require('../models/token');

/**
 * @description Middleware for authorization user
 * @param {Object} req 
 * @param {Oject} res 
 * @param {() => void} next 
 */
function authorization(req, res, next){
    if (!req.cookies.jwt){
        return res.redirect('/auth/login');
    }
    
    jwtVerify(req.cookies.jwt)
    .then(data => {
        Tokens
        .findOne({_id: data.token})
        .then(doc => {
            if (doc){
                req.user = data;
                next();
            } else {
                res.redirect('/auth/login');
            }
        }).catch(err => {
            databaseLogger.error(err);
            res.redirect('/auth/login');
        });
    })
    .catch(err => {
        serverLogger.error(err);
        res.redirect('/auth/login');
    })
}

function authorizationSocket(socket, next){
    let query = socket.request.headers.cookie.match(/jwt=([^;]*)/);
    if (!query || !query[1]){
        return socket.emit('authorization', {status: false});
    }
    
    jwtVerify(query[1])
    .then(data => {
        Tokens
        .findOne({_id: data.token})
        .then(doc => {
            if (doc){
                socket.user = data;
                next();
            } else {
                socket.emit('authorization', {status: false});
            }
        }).catch(err => {
            databaseLogger.error(err);
            socket.emit('authorization', {status: false});
        });
    })
    .catch(err => {
        serverLogger.error(err);
        socket.emit('authorization', {status: false});
    })
}

/**
 * @description Middleware for prevent user relogin when logined
 * @param {Object} req 
 * @param {Oject} res 
 * @param {() => void} next 
 */
function preventRelogin(req, res, next){
    if (!req.cookies.jwt){
        next();
    }else{
        jwtVerify(req.cookies.jwt)
        .then(data => {
            Tokens
            .findOne({_id: data.token})
            .then(doc => {
                if (doc){
                    res.redirect('/');
                } else {
                    next();
                }
            }).catch(err => {
                databaseLogger.error(err);
                next();
            });
        })
        .catch(err => {
            serverLogger.error(err);
            next();
        })
    }
}

module.exports = authorization;
module.exports.preventRelogin = preventRelogin;
module.exports.authorizationSocket = authorizationSocket