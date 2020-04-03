const express = require('express');
const app = express();
const settings = require('./config/settings');
const utils = require('./utils/utils');
const morgan = require('morgan');

app.use(morgan('dev'));

app.get('/', function(req, res) {
  const api = {
    'home': '/',
  };
  res.write(utils.createTextResepondJSONBeaufy(api));
  res.end();
});

app.use(function(err, req, res, next) {
  utils.serverErrorLogger(err.message);
  res.locals.message = err.message;
  res.locals.err = settings.type === 'production' ? {} : err;
  res.status(err.status || 500);
  res.render('error');
});

app.listen(settings.port);
