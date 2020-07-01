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

                for (let sensor of results[0]){
                    if (sensor.device_id != doc.sensor.device_id){
                        sensors.push(sensor);
                    }
                };

                for (let motor of results[1]){
                    if (motor.device_id != doc.motor.device_id){
                        motors.push(motor);
                    }
                };
            }

            console.log(sensors, motors, docs);

            res.render("pages/user.ejs", {
                _csrf: req.csrfToken(),
                user: req.user,
                sessions: results[2],
                devices: [...common, ...motors, ...sensors]
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

module.exports = router;