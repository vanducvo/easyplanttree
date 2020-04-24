const settings = {
  port: process.env.PORT || 5000,
  type: process.env.NODE_ENV || 'production',
  logFolder: './logs',
  cacheControl: process.env.NODE_ENV === 'development' ? false : true
};

module.exports = settings;