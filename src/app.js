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
const controller = require('./routes/controller');
const dashboard = require('./routes/dashboard');
const admin = require('./routes/admin/admin');
const user = require('./routes/user');
const map = require('./routes/map');

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
  cookie: {
    httpOnly: true,
    sameSite: 'strict'
  },
  sessionKey: process.env.CSRF_SECRET_KEY
}));

// Router to user action for account
app.use('/auth', auth);
app.use('/account', account);

// Admin page
app.use('/admin', admin);

// Middleware require user login
app.use(authorization);

// Dashbboard
app.use('/', dashboard);

// Map
app.use('/map', map);

// Controlller
app.use('/controller', controller);

// User
app.use('/user', user);

app.use('/api', api);

// Handle error
app.use(function(err, req, res, next) {
  serverLogger.error(err);
  res.locals.message = err.message;
  res.locals.err = settings.type === 'production' ? {} : err;
  res.status(err.status || 500);
  res.end();
});

const watering = require('./services/watering');
const Agenda = require('./services/agenda');

// Demon services
const {connect} = require('./services/broker');
const {createDBSaver, dashBoardUpdate, controllerUpdate, autoWatering} = require('./services/demon');
const client =  connect(
                    settings.clientBroker, settings.subTopic, settings.pubTopic,
                    process.env.MQTT_BROKER
                    );
createDBSaver(client, settings.subTopic, utils.classifyDevice);
client.setMaxListeners(Infinity);

// Socket
io.use(authorizationSocket);
io.setMaxListeners(Infinity);
dashBoardUpdate(io, client, settings.subTopic, utils.getSensorDevices);

// Agenda
const Emitter = require('events');
const brige = new Emitter();
brige.setMaxListeners(Infinity);

controllerUpdate(io, brige, utils.jwtDecode);
Agenda.initAgenda(process.env.DATABASE_URL);
Agenda.addSchedule('watering', watering.watering(brige, client, settings.pubTopic, 
                                          utils.createPayloadMotorToSpeaker));

Agenda.addSchedule('stop_watering', watering.stopWatering(client, settings.pubTopic, 
                                            utils.createPayloadMotorToSpeaker));

// Auto Watering
autoWatering(client, settings.subTopic, settings.pubTopic, utils.getAutoWateringInfo, utils.createPayloadMotorToSpeaker);

// Express App Listen Port
server.listen(settings.port);
