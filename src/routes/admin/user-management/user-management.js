const express = require("express");
const router = express.Router();

// Models
const { Device } = require('../../../models/device');
const User = require('../../../models/user');
const Token = require('../../../models/token');
const Dependent = require('../../../models/dependent');

//Utils
const {
    sensorPattern,
    motorPattern,
    getTypeDevice
} = require('../../../utils/utils');

// Loggers
const databaseLogger = require("../../../utils/logger").databaseLogger(module);

// Render homepage /user-management
router.get('/', function (req, res) {
    User.aggregate([
        {
            "$lookup": {
                from: 'devices',
                let: { user: "$_id" },
                pipeline: [
                    {
                        "$match": {
                            "$expr": {
                                "$eq": ["$user", "$$user"]
                            }

                        }
                    },
                    {
                        "$group": {
                            _id: "$user",
                            devices_id: { "$push": "$device_id" }
                        }
                    },
                    {
                        "$project": {
                            devices_id: 1
                        }
                    }
                ],
                as: "devices"
            }
        },
        {
            "$replaceRoot": {
                newRoot: {
                    $mergeObjects: [{ $arrayElemAt: ["$devices", 0] }, "$$ROOT"]
                }
            }
        },
        {
            "$project": {
                _id: 1,
                name: 1,
                email: 1,
                devices_id: 1
            }
        }
    ]).then(docs => {
        res.render('pages/user-management.ejs', {
            _csrf: req.csrfToken(),
            admin: req.admin,
            data: docs
        });
    }).catch(err => {
        databaseLogger.error(err);
        throw err;
    });
});

// Get login session of user
router.get("/loginsession", function (req, res) {
    let userID = req.query.userID;

    if (!userID) {
        // Return status code of BAD REQUEST
        return res.status(400).end();
    };

    Token
        .find({ user: userID })
        .select({ browser: 1, ip: 1 })
        .exec()
        .then(docs => {
            res.json(docs).end();
        })
        .catch(err => {
            databaseLogger.error(err);
            throw err;
        });

});

// Delete login session of user
router.delete("/loginsession", function (req, res) {
    let id = req.body.id;

    if (!id) {
        // Return status code of BAD REQUEST
        return res.status(400).end();
    }

    Token.deleteOne({ _id: id }).then(doc => {
        res.json(doc).end();
    }).catch(err => {
        databaseLogger.error(err);
        throw err;
    });
});

// Get all sensor indenpend user
router.get("/sensorindepend", function (req, res) {
    Device
        .find({
            user: {
                "$exists": false
            },
            device_id: {
                "$regex": sensorPattern
            }
        })
        .select({ _id: 0, device_id: 1 })
        .then(docs => {
            res.json(docs).end();
        })
        .catch(err => {
            databaseLogger.error(err);
            throw err;
        });
});

// Get all motor indenpend user
router.get("/motorindepend", function (req, res) {
    Device
        .find({
            user: {
                "$exists": false
            },
            device_id: {
                "$regex": motorPattern
            }
        })
        .select({ _id: 0, device_id: 1 })
        .then(docs => {
            res.json(docs).end();
        })
        .catch(err => {
            databaseLogger.error(err);
            throw err;
        });
});

// Get dependent divice A with device B
router.get("/dependent", function (req, res) {
    let { type, user, device } = req.query;
    if (type !== "sensor" && type !== "motor") {
        return res.status(400).end();
    }

    let opposite = {
        "motor": "sensor",
        "sensor": "motor"
    }

    let result = {
        location: {},
        constraint: []
    };

    Device
        .findOne({
            user: user,
            device_id: device
        })
        .select({ lat: 1, long: 1 })
        .exec()
        .then(doc => {
            if (!doc) {
                return res.status(204).end();
            }

            result.location = doc;
            let commands = [
                {
                    "$match": {
                        [type]: doc._id
                    }
                },
                {
                    $lookup: {
                        from: "devices",
                        localField: `${opposite[type]}`,
                        foreignField: "_id",
                        as: `${opposite[type]}_info`
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [
                                {
                                    $arrayElemAt: [`$${opposite[type]}_info`, 0]
                                },
                                "$$ROOT"
                            ]
                        }
                    }
                },
                {
                    $project: {
                        [type]: 0,
                        [opposite[type]]: 0,
                        [`${opposite[type]}_info`]: 0,
                        user: 0
                    },
                }

            ];

            Dependent
                .aggregate(commands)
                .then(doc => {
                    if (doc) {
                        result.constraint = doc;
                    }

                    res.json(result).end();

                }).catch(err => {
                    databaseLogger.error(err);
                    throw err;
                });;

        }).catch(err => {
            databaseLogger.error(err);
            throw err;
        });
});

// Get motor and sensor independent with another
router.get("/independent", function (req, res) {
    let { type, user, device } = req.query;
    if (type !== "sensor" && type !== "motor") {
        return res.json([]).end();
    }

    let pattern = {
        "sensor": sensorPattern,
        "motor": motorPattern
    };

    Device
        .findOne({
            user: user,
            device_id: device
        })
        .then(doc => {
            if (!doc) {
                return res.json([]).end();
            }

            let commands = [
                {
                    "$match": {
                        user: doc.user,
                        device_id: {
                            "$regex": pattern[type]
                        }
                    }
                },
                {
                    "$lookup": {
                        from: "dependents",
                        let: { device: "$_id" },
                        pipeline: [
                            {
                                "$match": {
                                    "$expr": {
                                        "$eq": ["$$device", `$${type}`]
                                    }
                                }
                            }
                        ],
                        as: "dependent"

                    }
                },
                {
                    "$match": {
                        "$expr": {
                            "$eq": [0, { "$size": "$dependent" }]
                        }
                    }
                },
                {
                    "$group": {
                        _id: null,
                        devices_id: { "$push": "$device_id" }
                    }
                },
                {
                    "$project": {
                        _id: 0,
                        devices_id: 1
                    }
                },
            ];

            Device.aggregate(commands).then(doc => {
                if (!doc[0]) {
                    return res.json([]).end();
                }


                res.json(doc[0].devices_id).end();
            }).catch(err => {
                databaseLogger.error(err);
                throw err;
            });

        }).catch(err => {
            databaseLogger.error(err);
            throw err;
        });
});

// Constraint user with device
router.put('/user-add-device', function (req, res) {
    let { user, device } = req.body;
    if (!user || !device) {
        return res.status(400).end();;
    }

    let verify = Promise.all([
        User.findOne({ _id: user }),
        Device.findOne({ device_id: device })
    ]);

    verify.then(docs => {
        Device
            .updateOne({ _id: docs[1]._id }, { user: docs[0]._id })
            .exec()
            .catch(err => {
                databaseLogger.error(err);
            });
    }).catch(err => {
        databaseLogger.error(err);
    });

    res.status(200).end();
});

// Remove constraint user with device
router.put('/user-remove-device', function (req, res) {
    let { device } = req.body;
    if (!device) {
        return res.status(400).end();
    }

    Device.findOne({ device_id: device }).then(doc => {
        if (!doc) {
            return;
        }

        let type = device.match(sensorPattern) ? 'sensor' : device.match(motorPattern) ? 'motor' : '';

        Dependent
        .deleteMany({ [type]: doc._id })
        .exec()
        .catch(err => {
            databaseLogger.error(err);
        });
    }).catch(err => {
        databaseLogger.error(err);
    });

    Device
    .updateOne({ device_id: device }, { "$unset": { user: 1, lat: 1, long: 1} })
    .exec();

    res.status(200).end();
});

// Add constraint  motor with sensor
router.put('/device-add-constraint', function (req, res) {
    let { user, master, slave } = req.body;
    let verify = Promise.all([
        Device.findOne({ user: user, device_id: master }),
        Device.findOne({ user: user, device_id: slave })
    ]);

    verify.then(docs => {
        if (!docs[0] || !docs[1]) {
            return;
        }

        if (user == docs[0].user && user == docs[1].user) {
            let data = {
                [getTypeDevice(docs[0])]: docs[0]._id,
                [getTypeDevice(docs[1])]: docs[1]._id
            };

            // Check have both motor and sensor
            if(!('motor' in data) || !('sensor' in data)){
                return;
            }

            let isExists = Promise.all([
                Dependent.findOne({ sensor: data.sensor }),
                Dependent.findOne({ motor: data.motor }),
            ]);

            isExists.then(valid => {
                if (valid[0] || valid[1]) {
                    return;
                }

                let constraint = new Dependent(data);
                constraint
                .save()
                .catch(err => {
                    databaseLogger.error(err);
                });

            }).catch(err => {
                databaseLogger.error(err);
            });
        }
    });

    res.status(201).end();
});

router.delete("/device-remove-constraint", function (req, res) {
    let { master, slave } = req.body;
    let verify = Promise.all([
        Device.findOne({ device_id: master }),
        Device.findOne({ device_id: slave })
    ]);

    verify.then(docs => {
        if (!docs[0] || !docs[1]) {
            return;
        }

        let data = {
            [getTypeDevice(docs[0])]: docs[0]._id,
            [getTypeDevice(docs[1])]: docs[1]._id
        };

        Dependent
        .deleteOne(data)
        .exec()
        .then(err => {
            databaseLogger.error(err);
        });
    });

    res.status(200).end();
});

router.put("/set-device-location", function(req, res){
    let {device, long, lat} = req.body;
    if(!device || !long || !lat){
        return res.status(400).end();
    }

    let regex = /^\d+\.\d+$/;
    if(!long.match(regex) || !lat.match(regex)){
        return res.status(400).end();
    }

    Device
    .updateOne({device_id: device}, {lat: lat, long: long})
    .exec()
    .catch(err => {
        databaseLogger.error(err);
    });

    res.status(200).end();
});

module.exports = router;