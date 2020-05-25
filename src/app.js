// Utils
const settings = require('./config/settings');
const path = require('path');
const utils = require('./utils/utils');

// Node load .env
if (process.env.NODE_ENV == "development"){
  require('dotenv').config({path: path.resolve('./.env.test')})
}else {
  require('dotenv').config();
}


// Express Framework
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
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
const api = require('./routes/api');
const dashboard = require('./routes/dashboard');

// Middleware Implement
const authorization = require('./services/authorization');
const {authorizationSocket} = require('./services/authorization');

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

// Serve Https only for deploy
var forceSSL = function (req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
  }
  return next();
};

if (process.env.NODE_ENV === 'production') {
      app.use(forceSSL);
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
app.use('/', dashboard);

// Map
app.get('/map', function(req, res) {
  res.render('pages/map.ejs', {user: req.user, _csrf: req.csrfToken()});
});

app.use('/api', api);

// Handle error
app.use(function(err, req, res, next) {
  serverLogger.error(err);
  res.locals.message = err.message;
  res.locals.err = settings.type === 'production' ? {} : err;
  res.status(err.status || 500);
  res.end();
});

// Demon services
const {connect} = require('./services/broker');
const {createDBSaver, dashBoardUpdate} = require('./services/demon');
const client =  connect(
                    settings.clientBroker, settings.subTopic, settings.pubTopic,
                    process.env.MQTT_BROKER
                    );
// createDBSaver(client, settings.subTopic, utils.classifyDevice);

// Socket
io.use(authorizationSocket);
io.setMaxListeners(Infinity);
dashBoardUpdate(io, client, settings.subTopic, utils.getSensorDevices);

// Express App Listen Port
server.listen(settings.port);
