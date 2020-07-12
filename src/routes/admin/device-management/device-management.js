const express = require("express");
const router = express.Router();
const {Device} = require("../../../models/device");
const {sensorPattern, motorPattern, getTypeDevice} = require("../../../utils/utils");
const Dependent = require("../../../models/dependent");

router.get('/', function (req, res){
    let getData = Promise.all([
        Device.find({}).select({ _id: 0, device_id: 1 }),
        //User.find({}).select({ _id: 0, email: 1, name: 1 })
    ]);

    getData.then(data => {
        res.render('pages/device-management.ejs', {
            _csrf: req.csrfToken(),
            admin: req.admin,
            data: data
        });
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
            return res.status(400).end();
        });
    }).catch(err => {
        return res.status(400).end();
    });


});

router.delete('/delete', function(req, res){
    let id = req.body.device;
    if(!id){
        return res.status(400).end();
    }

    let type = getTypeDevice({device_id: id});

    Device
    .findOne({device_id: id})
    .then(device => {
        Promise.all([
            Device.deleteOne({_id: device._id}),
            Dependent.deleteOne({[type]: device._id})
        ])
        .then(docs => {
            if(!docs[0].n){
                return res.status(400).end();
            }
    
            res.json({n: docs[0].n}).end();
        })
        .catch(err => {
            return res.status(400).end();
        });
    })
    .catch(err => {
        return res.status(400).end();
    });
});

module.exports = router;