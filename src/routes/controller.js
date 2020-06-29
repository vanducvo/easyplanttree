const express = require('express');
const router = express.Router();
const { Device, Watering, Motor } = require('../models/device');
const { getTypeDevice, motorPattern } = require('../utils/utils');
const databaseLogger = require('../utils/logger').databaseLogger(module);
const Agenda = require('../services/agenda');

router.get('/', function (req, res) {
  let user = req.user.id;
  let datas = Promise.all([
    Agenda.getHistory(user),
    Agenda.getFuture(user),
    Device.find({
      user: user,
      device_id: { "$regex": motorPattern },
    })
      .select({ _id: 0, device_id: 1 })
      .exec()
  ]);

  datas.then(docs => {

    res.render('pages/controller.ejs', {
      _csrf: req.csrfToken(),
      user: req.user,
      motors: docs[2],
      histories: docs[0].map(doc => doc.attrs),
      futures: docs[1].map(doc => doc.attrs)
    });
  });
});

router.post('/', function (req, res) {
  let info = req.body;
  let data = {
    user: req.user.id,
    device_id: info.device,
    watering_time: info.watering_time,
    intensity: info.intensity
  };

  Agenda
    .getConflict(req.user.id, info.when, info.watering_time, info.device)
    .then(isConflict => {
      
      if(isConflict){
        return res.json({overlap: true}).end();
      }


      let start = new Date(info.when);
      let end = new Date(start.getTime() + Number(info.watering_time) * 60000);

      // Set Start
      let schedule = Agenda.once(start, 'watering', data);

      schedule.then(doc => {

        // Set stop
        Agenda.once(end, 'stop_watering', {
          user: data.user,
          watering: doc._id,
          device_id: data.device_id,
          intensity: "0"
        }).then(() => {

          // Response to client
          res.json({
            _id: doc._id,
            data: doc.data,
            nextRunAt: doc.nextRunAt
          }).end();

        });
      });

    });

});

router.delete('/', function (req, res) {
  Agenda.cancel(req.body.id).then(success => {
    if (success) {
      res.json({ id: req.body.id }).end();
    } else {
      res.json({}).end()
    }
  });

});

module.exports = router;
