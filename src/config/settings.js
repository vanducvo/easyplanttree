const settings = {
  port: process.env.PORT || 5000,
  type: process.env.NODE_ENV || 'dev',
  logFolder: './logs',
};

module.exports = settings;
