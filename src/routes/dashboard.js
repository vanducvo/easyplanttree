const express = require('express');
const router = express.Router();
const { Device, SoilMoisture } = require('../models/device');
const { getTypeDevice } = require('../utils/utils');
const databaseLogger = require('../utils/logger').databaseLogger(module);
const mongoose = require('mongoose');

router.get('/', function (req, res) {

    Device.find({ user: req.user.id }).then(docs => {
        let devices = {
            sensor: [],
            gps: [],
            motor: []
        };
        docs.forEach(doc => {
            let type = getTypeDevice(doc);
            if (type) {
                devices[type].push(doc.device_id);
            }
        });

        res.render('pages/index.ejs', {
            user: req.user,
            _csrf: req.csrfToken(),
            devices: devices
        });
    }).catch(err => {
        databaseLogger.error(err);
        throw err;
    });
});

router.get('/getdatasensor', function (req, res) {
    let id = req.query.id;
    let limit = req.query.limit;
    let begin = req.query.begin;
    if (!id || !/^id7_\d+$/.test(id)) {
        return res.status(204).end();
    }

    if (!limit || !/^\d+$/.test(limit)) {
        limit = 20;
    } else {
        limit = Number(limit);
    }

    if (!begin) {
        begin = new Date(Date.now() - 10800000);
    } else {
        begin = new Date(new Date(begin).getTime() + 1);
    }

    // user bellong device
    Device.find({ user: req.user.id, device_id: id }).then(docs => {

        if (docs.length === 0) {
            return res.status(204).end();
        }

        // get data of sensor
        SoilMoisture.aggregate([{
            "$match": {
                device_id: id,
                'value.0': '1',
                time: {
                    "$gte": begin
                },
            }
        }, {
            "$project": {
                _id: 0,
                time: 1,
                moisture: {
                    "$arrayElemAt": ["$value", -1]
                }
            }
        }, {
            "$limit": limit
        }
        ]).then(docs => {

            return res.status(200).json({
                limit: limit,
                begin: docs[docs.length - 1] ? docs[docs.length - 1].time : '',
                docs: docs
            }).end();
        });

    }).catch(err => {
        databaseLogger.error(err);
        throw err;
    });

});

router.get('/averageallsensor', function(req, res){
    // Change to begin day of week
    let type = req.query.type;
    let start = new Date();
    let end = new Date();
    let day = start.getDay();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));

    if(type && type === "preweek"){
        end = new Date(start);
        start.setDate(start.getDate() - 7);
        end.setSeconds(end.getSeconds() - 1);
    }
    
    // Query
    Device.find({user: req.user.id, device_id: {"$regex": /^id7_\d+$/}})
    .then(docs => docs.map(doc => doc.device_id))
    .then(ids => {
        SoilMoisture.aggregate([
            {
                "$match": {
                    device_id: {"$in": ids},
                    'value.0': '1',
                    time: {
                        "$gte": start,
                        "$lte": end
                    },
                }
            },
            {
                "$project": {
                    device_id: 1,
                    moisture: {
                        "$arrayElemAt": ["$value", -1]
                    }
                }
            },
            {
                "$group": {
                    _id: "$device_id",
                    average:{
                        "$avg": {
                            "$toInt": "$moisture"
                        }
                    }
                }
            }
        ]).then(stats => {
            res.json(stats).status(200).end();
        }).catch(err => {
            databaseLogger.error(err);
        });
    });
});

router.get('/analysis-watering', function(req, res){
    // Change to begin day of week
    let type = req.query.type;
    let start = new Date();
    let end = new Date();
    let day = start.getDay();
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));

    if(type && type === "preweek"){
        end = new Date(start);
        start.setDate(start.getDate() - 7);
        end.setSeconds(end.getSeconds() - 1);
    }

    mongoose.connection.db.collection('agenda', function(err, collection){
        if(err){
            res.status(500).end();
        }

        collection.aggregate([
            {
                "$match": {
                    name: 'watering',
                    lastRunAt: {
                        "$gte": start,
                        "$lte": end
                    }
                }
                
            },
            {
                "$project": {
                    day: {
                        "$dayOfWeek": "$lastRunAt"
                    }
                }
            },
            {
                "$group":{
                    _id: "$day",
                    times: {
                        "$sum": 1
                    }
                }
            },
            {
                "$sort": {
                    _id: 1
                }
            }
        ])
        .toArray()
        .then(docs => {
            res.json(docs).end();
        })
        .catch(err => {
            res.status(500).end();
        });
    });
});

module.exports = router;