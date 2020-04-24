// Node load .env
require('dotenv').config()

// Express Framework
const express = require('express');
const app = express();

// Database ODM
const mongoose = require('mongoose');


// Middleware Libary
const serveStatic = require('serve-static');
const serveFavicon = require('serve-favicon');
const cookieParse = require('cookie-parser');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const morgan = require('morgan');

// Router
const auth = require('./routes/authentication');
const account = require('./routes/account');

// Middleware Implement
const authorization = require('./services/authorization');

// Utils
const settings = require('./config/settings');
const utils = require('./utils/utils');
const path = require('path');

// Logger
const serverLogger = require('./utils/logger').serverLogger(module);

// Connect Database
mongoose.connect(process.env.DATABASE_URL, { 
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Http Logger when development
if (process.env.NODE_ENV == "development"){
  app.use(morgan('dev'));
}

// Serve Favicon
app.use(serveFavicon(path.resolve(__dirname, 'public/favicon.ico')));

// Setting template
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

// Serve assests
app.use('/public', serveStatic(
    path.resolve(__dirname, 'public'),
    {
      cacheControl: settings.cacheControl
    }
));

// Middleware for cookie, bodydata
app.use(cookieParse());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Middleware security protect webapp csrf attaction
app.use(csrf({
  cookie: true,
  sessionKey: process.env.CSRF_SECRET_KEY
}));

// Router to user action for account
app.use('/auth', auth);
app.use('/account', account);

// Middleware require user login
app.use(authorization);

// Dashbboard
app.get('/', function(req, res) {
  res.render('pages/index.ejs', {user: req.user});
});

// Map
app.get('/map', function(req, res) {
  res.render('pages/map.ejs', {user: req.user});
});

// API for services
app.get('/api', function(req, res) {
  const api = {
    'home': '/',
  };
  res.write(utils.createTextResepondJSONBeaufy(api));
  res.end();
});


// Handle error
app.use(function(err, req, res, next) {
  serverLogger.error(err);
  res.locals.message = err.message;
  res.locals.err = settings.type === 'production' ? {} : err;
  res.status(err.status || 500);
  res.end();
});

app.listen(settings.port);
