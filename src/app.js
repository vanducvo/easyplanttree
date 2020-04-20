const express = require('express');
const app = express();

const path = require('path');
const serveStatic = require('serve-static');
const serveFavicon = require('serve-favicon');
const cookieParse = require('cookie-parser');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const morgan = require('morgan');

const auth = require('./routes/authentication');
const account = require('./routes/account');
const settings = require('./config/settings');
const utils = require('./utils/utils');
const authorization = require('./services/authorization');
const mongoose = require('mongoose');

mongoose.connect(settings.database, { 
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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

app.use(cookieParse());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(csrf({
  cookie: true,
  sessionKey: settings.csrf_secretkey
}));

app.use('/auth', auth);
app.use('/account', account);

app.use(authorization);

app.get('/', function(req, res) {
  console.log(req.user);
  res.render('pages/index.ejs', {user: req.user});
});

app.get('/map', function(req, res) {
  res.render('pages/map.ejs', {user: req.user});
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
  res.end();
});

app.listen(settings.port);
