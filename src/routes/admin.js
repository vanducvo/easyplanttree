const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');
const { Device } = require('../models/device');
const User = require('../models/user');
const Token = require('../models/token');
const Dependent = require('../models/dependent');

const {
    sensorPattern,
    motorPattern,
    promiseVerifyScrypt,
    jwtCreateWithExpire,
    jwtVerify
} = require('../utils/utils');

const serverLogger = require('../utils/logger').serverLogger(module);
const databaseLogger = require('../utils/logger').databaseLogger(module);

// Prevent PreLogin
router.get('/login', function (req, res, next) {
    let token = req.cookies.jwt_admin;
    if (!token) {
        next();
    }

    jwtVerify(token).then(valid => {
        if (!valid) {
            next();
        }
        return res.redirect('/admin');
    }).catch(err => {
        serverLogger.error(err);
        next();
    });
});

router.get('/login', function (req, res) {
    res.render('pages/admin-login.ejs', { _csrf: req.csrfToken(), wrong: req.query.wrong });
});

router.post('/login', function (req, res) {
    Admin.findOne({ email: req.body.email }).then(doc => {
        if (!doc) {
            return res.redirect('/admin/login?wrong=email');
        }
        promiseVerifyScrypt(req.body.password, doc.password)
            .then(valid => {
                if (!valid) {
                    return res.redirect('/admin/login?wrong=password');
                }

                let ip = req.headers['x-forwarded-for']
                    || req.connection.remoteAddress || '';

                let admin = {
                    rule: "admin",
                    email: doc.email,
                    name: doc.name,
                    id: doc._id,
                    ip: ip
                };

                let token = jwtCreateWithExpire(admin, '1d');

                res.cookie('jwt_admin', token, {
                    httpOnly: true,
                    sameSite: 'strict',
                    maxAge: 86400000
                });

                res.redirect('/admin');
            })
            .catch(err => {
                serverLogger.error(err);
                res.redirect('/admin/login');
            });
    }).catch(err => {
        databaseLogger.error(err);
        res.redirect('/admin/login');
    });
});

// Authorization admin
router.use(function (req, res, next) {
    let token = req.cookies.jwt_admin;
    if (!token) {
        return res.redirect('/admin/login');
    }

    let ip = req.headers['x-forwarded-for']
        || req.connection.remoteAddress || '';


    jwtVerify(token).then(valid => {
        if (!valid) {
            return res.redirect('/admin/login');
        }

        if (ip !== valid.ip) {
            return res.redirect('/admin/login');
        }

        req.admin = valid;
        next();
    }).catch(err => {
        serverLogger.error(err);
        return res.redirect('/admin/login');
    });
});

router.get('/logout', function (req, res) {
    res.clearCookie('jwt_admin');
    res.redirect('/admin/login');
});

router.get('/', function (req, res) {
    let getData = Promise.all([
        Device.find({}).select({ _id: 0, device_id: 1 }),
        User.find({}).select({ _id: 0, email: 1, name: 1 })
    ]);

    getData.then(data => {
        res.render('pages/admin.ejs', {
            _csrf: req.csrfToken(),
            admin: req.admin,
            data: data
        });
    });
});

router.get('/user-management', function (req, res) {
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
    });
});

router.get("/loginsession", function (req, res) {
    let userID = req.query.userID;
    Token
        .find({ user: userID })
        .select({ browser: 1, ip: 1 })
        .exec()
        .then(docs => {
            res.json(docs).end();
        });

});

router.delete("/loginsession", function (req, res) {
    let id = req.body.id;

    if (!id) {
        res.json({ error: "id not include" }).end();
    }

    Token.deleteOne({ _id: id }).then(doc => {
        res.json(doc).end();
    });
});

router.get("/sensorindepend", function (req, res) {
    Device.find({
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
        });
});

router.get("/motorindepend", function (req, res) {
    Device.find({
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
        });
});

router.get("/dependent", function (req, res) {
    let { type, user, device } = req.query;
    if (type !== "sensor" && type !== "motor") {
        return res.status(204).end();
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
                        [opposite[type]]: 0 , 
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
                });
        });
});

module.exports = router;