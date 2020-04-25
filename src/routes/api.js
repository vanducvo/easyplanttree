const express = require('express');
const router = express.Router();
const {createTextResepondJSONBeaufy} = require('../utils/utils')
const Token = require('../models/token');
const pusher = require('../services/webpush');

router.get('/', function (req, res) {
    const api = {
        'home': '/',
    };
    res.write(createTextResepondJSONBeaufy(api));
    res.end();
});

router.post('/save-subscription', function(req, res){
    if (req.body.endpoint && req.body.keys && req.body.keys.p256dh && req.body.keys.auth){
        Token.updateOne(
            {
                _id: req.user.token
            }, 
            {
                pusher: JSON.stringify(req.body)
            }
        ).then(doc => {

        }).catch(err => {
            
        });
        res.status(200);
        res.json({data: {success: true}});
        res.end();
    } else {
        res.status(400);
        res.json({data: {success: false}});
        res.end();
    }
});

router.get('/testwebpush', function (req, res){
    pusher(req.query.token, req.query.message);
    res.status(200);
    res.json({user: req.query.token});
    res.end();
});

module.exports = router;