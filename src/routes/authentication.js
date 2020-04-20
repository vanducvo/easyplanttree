const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Token = require('../models/token');
const {preventRelogin} = require('../services/authorization');
const { logger, jwtCreate, jwtVerify, promiseVerifyScrypt } = require('../utils/utils');

router.get('/logout', function(req, res){
    jwtVerify(req.cookies.jwt)
    .then(data => {
        Token
        .findOneAndDelete({token: req.cookies.jwt})
        .then(doc => {
            res.clearCookie('jwt');
            res.redirect('/auth/login');
        }).catch(err => {
            res.redirect('/');
        });
    });
});

router.use(preventRelogin);

router.get('/login', function (req, res) {
    res.render('pages/login.ejs', { _csrf: req.csrfToken(), wrong: req.query.wrong });
});

router.post('/login', function (req, res) {
    User
        .findOne({ email: req.body.email })
        .then(doc => {
            if (!doc) {
                res.redirect('/auth/login?wrong=email');
            } else {
                promiseVerifyScrypt(req.body.password, doc.password)
                    .then(result => {
                        if (result) {
                            let user = {
                                id: doc._id,
                                name: doc.name,
                                email: doc.email
                            };

                            let token = jwtCreate(user, '1d');
                            let ip = req.headers['x-forwarded-for']
                                || req.connection.remoteAddress || '';
                            let agent = req.get('User-Agent');
                            let storeToken = new Token({
                                user: doc._id,
                                browser: agent,
                                token: token,
                                ip: ip
                            });

                            storeToken
                                .save()
                                .then(doc => {
                                    res.cookie('jwt', token, {
                                        sameSite: 'strict'
                                    });
                                    res.redirect('/');
                                }).catch(err => {
                                    logger.error(err);
                                    res.redirect('/auth/login');
                                });
                        } else {
                            res.redirect('/auth/login?wrong=password');
                        }
                    }).catch(err => {
                        logger.error(err);
                        res.redirect('/auth/login');
                    })
            }
        })
});

module.exports = router;