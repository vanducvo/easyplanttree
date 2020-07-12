const express = require("express");
const router = express.Router();
const {Device} = require('../models/device');

router.get('/', function(req, res){
    Device
    .find({user: req.user.id})
    .then(devices => {
        res.render('pages/map.ejs', {
            user: req.user,
            _csrf: req.csrfToken(),
            devices: devices
        });
    });
});

module.exports = router;