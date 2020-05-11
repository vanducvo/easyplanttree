// Framework router
const express = require('express');
const router = express.Router();

// services
const mailer = require('../services/mailer');

// models
const User = require('../models/user');

// Middleware
const {preventRelogin} = require('../services/authorization');

// Utils
const {checkEmail, promiseScrypt, jwtCreateWithExpire, jwtVerify} = require('../utils/utils');
const debugLogger = require('../utils/logger').debugLogger(module);
const serverLogger = require('../utils/logger').serverLogger(module);
const databaseLogger = require('../utils/logger').databaseLogger(module);

// Middleware prevent reloggin
router.use(preventRelogin);

// Render UI for user signup
router.get('/signup', function(req, res){
    res.render('pages/signup.ejs', {_csrf: req.csrfToken()});
});

// Handle POST user signup
router.post('/signup', function(req, res){

    promiseScrypt(req.body.password)
    .then(key => {
        req.body.password = key;
        let token = jwtCreateWithExpire(req.body, '1d');
        let url = `${req.protocol}://${req.get('host')}/account/verify?data=${token}`
        mailer('Easy Plant Tree', {
            to: req.body.email,
            subject: 'Validation Email',
            html: `<p>Please Click link to verify email: <a href="${url}">Vertify<a><p>`
        });
        res.status(200);
        res.end();
    }).catch(err => {
        serverLogger.error(err);
        res.status(400);
        res.end();
    });
});

// Verify user by email
router.get('/verify', function(req, res){
    let data = req.query.data;
    if(!data){
        debugLogger.error('data verify null');
        res.render('pages/verify', {verify: false});
    }

    jwtVerify(data)
    .then(decoded => {
        User.findOne({email: decoded.email})
        .then(doc => {
            if(doc) {
                res.render('pages/verify', {verify: true});
            } else {
                let user = new User({
                    name: decoded.name,
                    password: decoded.password,
                    email: decoded.email
                });
    
                user
                .save()
                .then(doc => {
                    res.render('pages/verify', {verify: true});
                })
                .catch(err => {
                    databaseLogger.error(err);
                    res.render('pages/verify', {verify: false});
                });
            }
        }).catch(err => {
            databaseLogger.error(err);
            res.render('pages/verify', {verify: false});
        });
    }).catch(err => {
        serverLogger.log(err);
        res.render('pages/verify', {verify: false});
    });
});

// Check email have in database
router.post('/check',  function(req, res){
    User.findOne({email: req.body.email})
    .then(doc => {
        if(doc){
            res.json({status: false});
        } else{
            res.json({status: true});
        }
        res.status(200);
        res.end();
    }).catch(err => {
        databaseLogger.error(err);
        res.status(400);
        res.json({status: false});
        res.end();
    });
});

router.get('/forget', function(req, res){
    res.render('pages/forget.ejs', {_csrf: req.csrfToken()});
});

router.post('/forget', function(req, res){
    let email = req.body.email;
    if(checkEmail(email)){
        let token = jwtCreateWithExpire({email}, '10m')
        let url = `${req.protocol}://${req.get('host')}/account/reset?token=${token}`;
        mailer('Easy Plant Tree', {
            to: email,
            subject: 'Reset Email',
            html: `<p>Please Click link to reset password: <a href="${url}">Reset<a><p>`
        });
    }
    res.redirect('/');
});

router.get('/reset', function(req, res){
    let token = req.query.token;
    if(token){
        jwtVerify(token)
        .then(data => {
            if(data){
                res.render('pages/reset.ejs', {
                    email: data.email,
                    token: token,
                     _csrf: req.csrfToken()
                });
            }else {
                res.render('pages/resetfail.ejs');
            }
        }).catch(err => {
            serverLogger.error(err);
            res.render('pages/resetfail.ejs');
        })
    } else {
        res.render('pages/resetfail.ejs');
    }
});

router.post('/reset', function(req, res){
    let token = req.body.token;
    let password = req.body.password;
    console.log(password);
    if(token && password){
        jwtVerify(token)
        .then(data => {
            if(data){
                promiseScrypt(password)
                .then(pass => {
                    User.updateOne({
                        email: data.email
                    },
                    {
                        password: pass
                    }
                    ).then(doc => {
                        res.redirect('/');
                    }).catch(err => {
                        databaseLogger.err(err);
                        res.render('pages/resetfail.ejs');
                    })
                })
                .catch(err => {
                    serverLogger.error(err);
                    res.render('pages/resetfail.ejs');
                })
            }else {
                res.render('pages/resetfail.ejs');
            }
        }).catch(err => {
            serverLogger.error(err);
            res.render('pages/resetfail.ejs');
        })
    } else {
        res.render('pages/resetfail.ejs');
    }
});

module.exports = router;