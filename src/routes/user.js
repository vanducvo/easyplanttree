const express = require("express");
const router = express.Router();
const Token = require("../models/token");
const {Device} = require("../models/device");
const Dependent = require("../models/dependent");
//Utils
const {
    sensorPattern,
    motorPattern
} = require('../utils/utils');

router.get('/', function(req, res){
    let commander = Promise.all([
        Device
        .find({user: req.user.id, device_id: {"$regex": sensorPattern}}),
        
        Device
        .find({user: req.user.id, device_id: {"$regex": motorPattern}}),
        
        Token
        .find({user: req.user.id})
        .select({
            browser: 1,
            ip: 1
        })
        .exec()
    ]);

    commander.then(results => {
        let queries = []; 
        for (let doc of results[0]){
            queries.push(
                Dependent
                .findOne({sensor: doc})
                .populate('sensor motor')
                .exec()
            );
        }

        Promise.all(queries).then(docs => {
            let sensors = [];
            let motors = [];
            let common = [];
            
            for (let doc of docs){
                if(!doc){
                    continue;
                }

                common.push(doc);

                sensors.push(doc.sensor.device_id);
                motors.push(doc.motor.device_id);
            }

            res.render("pages/user.ejs", {
                _csrf: req.csrfToken(),
                user: req.user,
                sessions: results[2],
                devices: [
                    ...common, 
                    ...results[0].filter(v => sensors.indexOf(v.device_id) < 0), 
                    ...results[1].filter(v => motors.indexOf(v.device_id) < 0), 
                ]
            });
        });
    });
});

router.delete('/session', function(req, res){
    Token
    .deleteOne({_id: req.body._id, user: req.user.id})
    .then(doc => {
        if(!doc){
            return res.status(204).end()
        }

        res.json(doc).end();
    }).catch(err => {
        // Log error
        return res.status(204).end()
    });
    
});

router.put('/limit', function(req, res){
    Dependent
    .updateOne({_id: req.body._id}, {
        max: Number(req.body.max),
        min: Number(req.body.min)
    }).then(doc => {
        res.json(doc).end();
    }).catch(err => {
        res.status(400).end();
    })
});

router.delete('/limit', function(req, res){
    Dependent
    .updateOne({_id: req.body._id}, {"$unset": {max: 1, min: 1}})
    .exec()
    .then(doc => {
        res.json(doc).end();
    }).catch(err => {
        res.status(400).end();
    })
});

module.exports = router;