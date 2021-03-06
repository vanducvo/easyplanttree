const express = require('express');
const router = express.Router();
const userManagement = require("./user-management/user-management");
const deviceManagement = require('./device-management/device-management');

//Models
const Admin = require('../../models/admin');
const { Device } = require('../../models/device');
const User = require('../../models/user');

// Utils
const {
    promiseVerifyScrypt,
    jwtCreateWithExpire,
    jwtVerify
} = require('../../utils/utils');

const serverLogger = require('../../utils/logger').serverLogger(module);
const databaseLogger = require('../../utils/logger').databaseLogger(module);

// Prevent PreLogin admin
router.get('/login', function (req, res, next) {
    let token = req.cookies.jwt_admin;
    if (!token) {
        next();
        return;
    }

    jwtVerify(token).then(valid => {
        if (!valid) {
            next();
            return;
        }

        res.redirect('/admin');
    }).catch(err => {
        serverLogger.error(err);
        next();
    });
});

// Login admin page
router.get('/login', function (req, res) {
    res.render('pages/admin-login.ejs', { _csrf: req.csrfToken(), wrong: req.query.wrong });
});

// Login request
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

// Logout admin
router.get('/logout', function (req, res) {
    res.clearCookie('jwt_admin');
    res.redirect('/admin/login');
});

// Render admin page
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

//Router to user management page
router.use('/user-management', userManagement);

//Router to device management page
router.use('/device-management', deviceManagement);

module.exports = router;