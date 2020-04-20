const {logger, jwtVerify} = require('../utils/utils');
const Tokens = require('../models/token');

function authorization(req, res, next){
    jwtVerify(req.cookies.jwt)
    .then(data => {
        Tokens
        .findOne({token: req.cookies.jwt})
        .then(doc => {
            if (doc){
                req.user = data;
                next();
            } else {
                res.redirect('/auth/login');
            }
        }).catch(err => {
            logger.error(err);
            res.redirect('/auth/login');
        });
    })
    .catch(err => {
        logger.error(err);
        res.redirect('/auth/login');
    })
}

function preventRelogin(req, res, next){
    jwtVerify(req.cookies.jwt)
    .then(data => {
        Tokens
        .findOne({token: req.cookies.jwt})
        .then(doc => {
            if (doc){
                res.redirect('/');
            } else {
                next();
            }
        }).catch(err => {
            logger.error(err);
            next();
        });
    })
    .catch(err => {
        logger.error(err);
        next();
    })
}

module.exports = authorization;
module.exports.preventRelogin = preventRelogin;