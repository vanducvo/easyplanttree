const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {Device, Watering, Motor} = require('../models/device');
const {getTypeDevice, motorPattern} = require('../utils/utils');
const databaseLogger = require('../utils/logger').databaseLogger(module);
const Agenda = require('../services/agenda');

router.get('/', function(req, res) {
  Device.find({
    user: req.user.id,
    device_id: {"$regex": motorPattern},
  })
  .select({_id: 0, device_id: 1})
  .exec()
  .then( motors => {
    res.render('pages/controller.ejs', {
      _csrf: req.csrfToken(),
      user: req.user,
      motors: motors
    });
  });
});

router.post('/', function(req, res){
  let info = req.body;
  let data = {
    user: req.user.id,
    device_id: info.device,
    watering_time: info.watering_time,
    intensity: info.intensity
  };
  console.log(data);
  let schedule = Agenda.once(new Date(info.when), 'watering', data);
  schedule.then(doc => {
    res.json({
      _id: doc._id,
      data: doc.data,
      nextRunAt: doc.nextRunAt
    }).end();
  });
});

module.exports = router;
