const settings = {
  clientBroker:{
    id: 'App_2_1',
    username: 'App_2_1',
    password: 'App_2_1'
  },
  subTopic: 'T_3',
  pubTopic: 'T_4',
  port: process.env.PORT || 5000,
  type: process.env.NODE_ENV || 'production',
  logFolder: './logs',
  cacheControl: process.env.NODE_ENV === 'development' ? false : true
};

module.exports = settings;