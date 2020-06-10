const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {Device, Watering, Motor} = require('../models/device');
const {getTypeDevice} = require('../utils/utils');
const databaseLogger = require('../utils/logger').databaseLogger(module);

router.get('/', function(req, res) {
  let start = new Date();
  let end = new Date();
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  start.setMilliseconds(0);

  Device.find({
    user: req.user.id,
    device_id: {"$regex": /^id9_\d+$/},
  }).then( docs => {

    let queries = Promise.all(docs.map(doc => {
      return Watering.find({
        device_id: doc.device_id,
      });
    }));
    
    queries
    .then(docs => {
      console.log(JSON.stringify(docs.flat(), null,2))
      res.render('pages/controller.ejs', {
        user: req.user,
        _csrf: req.csrfToken(),
        wh: docs.flat(),
      });
    })
    .catch(err => {
      databaseLogger.error(err);
      throw err;
    });
    
  }).catch((err) => {
    databaseLogger.error(err);
    throw err;
  });

});

module.exports = router;
