const settings = {
  clientBroker:{
    id: 'App_2',
    username: 'App_2',
    password: 'App_2'
  },
  subTopic: 'T_3',
  pubTopic: 'T_4',
  port: process.env.PORT || 5000,
  type: process.env.NODE_ENV || 'production',
  logFolder: './logs',
  cacheControl: process.env.NODE_ENV === 'development' ? false : true
};

module.exports = settings;