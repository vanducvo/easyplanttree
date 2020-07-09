const express = require("express");
const router = express.Router();
const {Device} = require("../../../models/device");
const {sensorPattern, motorPattern} = require("../../../utils/utils");

router.get('/', function (req, res){
    res.render('pages/device-management.ejs', {
        _csrf: req.csrfToken(),
        admin: req.admin
    });
});

router.post('/add', function (req, res){

    function command(pattern){
        return [
            {
                "$match": {
                    device_id: {
                        "$regex": pattern
                    }
                }
            },
            {
                "$project": {
                    ids: {
                        "$split": ["$device_id", "_"]
                    }
                }
            },
            {
                "$group": {
                    _id: null,
                    max: {
                        "$max": {
                            "$toInt": {
                                "$arrayElemAt": ["$ids", 1]
                            }
                        }
                    }
                }
            },
            {
                "$project": {
                    _id: 0
                }
            }
        ];
    }

    let data = req.body;
    // Find max device id + 1
    if(!data || !data.type){
        return res.status(400).end();
    }
    let pattern =  null;
    switch(data.type){
        // Sensor
        case "0":
            pattern = sensorPattern;      
            break;

        // Motor
        case "1":
            pattern = motorPattern;
            break;
    }

    if(!pattern){
        return res.status(400).end();
    }

    Device.aggregate(command(pattern)).then(docs => {
        let max = 0;
        if(docs && docs.length){
            max = docs[0].max;
        }

        let sensor = new Device({
            device_id: data.type === "0" ? `id7_${max+1}` : `id9_${max+1}`
        });

        sensor.save().then(doc => {
            if(!doc){
                return res.end(500).end();
            }

            res.json(doc).end();
        }).catch(err => {

        });
    }).catch(err => {
        
    });


});

router.delete('/delete', function(req, res){
    let id = req.body.device;
    if(!id){
        return res.status(400).end();
    }
    Device.deleteOne({_id: id})
    .then(doc => {
        if(!doc.n){
            return res.status(400).end();
        }

        res.json({n: doc.n}).end();
    }).catch(err => {

    });
});

module.exports = router;