const express = require('express');
const router = express.Router();
const { Device, SoilMoisture } = require('../models/device');
const { getTypeDevice } = require('../utils/utils');
const databaseLogger = require('../utils/logger').databaseLogger(module);

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

module.exports = router;