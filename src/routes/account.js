const express = require('express');
const router = express.Router();
const mailer = require('../services/mailer');
const User = require('../models/user');
const {preventRelogin} = require('../services/authorization');
const {logger, promiseScrypt, jwtCreate, jwtVerify} = require('../utils/utils');


router.use(preventRelogin);

router.get('/signup', function(req, res){
    res.render('pages/signup.ejs', {_csrf: req.csrfToken()});
});

router.post('/signup', function(req, res){

    promiseScrypt(req.body.password)
    .then(key => {
        req.body.password = key;
        let token = jwtCreate(req.body);
        let url = `${req.protocol}://${req.get('host')}/account/verify?data=${token}`
        mailer('Easy Plant Tree', {
            to: req.body.email,
            subject: 'Validation Email',
            html: `<p>Please Click link to verify email: <a href="${url}">Vertify<a><p>`
        });
        res.status(200);
        res.end();
    }).catch(err => {
        logger.error(err);
        res.status(400);
        res.end();
    });
});

router.get('/verify', function(req, res){
    let data = req.query.data;

    if(!data){
        logger.error('data verify null');
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
                    logger.error(err);
                    res.render('pages/verify', {verify: false});
                });
            }
        }).catch(err => {
            logger.error(err);
            res.render('pages/verify', {verify: false});
        });
    }).catch(err => {
        logger.error(err);
        res.render('pages/verify', {verify: false});
    });
});

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
        res.status(400);
        res.json({status: false});
        res.end();
    });
});

module.exports = router;