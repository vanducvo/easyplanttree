const express = require('express');
const app = express();
const settings = require('./config/settings');
const utils = require('./utils/utils');
const path = require('path');
const serveStatic = require('serve-static');
const serveFavicon = require('serve-favicon');
const morgan = require('morgan');

app.use(morgan('dev'));

app.use(serveFavicon(path.resolve(__dirname, 'public/favicon.ico')));

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use('/public', serveStatic(
    path.resolve(__dirname, 'public'),
    {
      cacheControl: settings.cacheControl
    }
));

app.get('/', function(req, res) {
  res.render('pages/index.ejs');
});

app.get('/map', function(req, res) {
  res.render('pages/map.ejs');
});

app.get('/signin', function(req, res) {
  res.render('pages/signin.ejs');
});

app.get('/api', function(req, res) {
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
