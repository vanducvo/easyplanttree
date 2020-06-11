const settings = {
  clientBroker:{
    id: 'APP_1711096',
    username: 'BKvm2',
    password: 'Hcmut_CSE_2020'
  },
  subTopic: 'Topic/Mois',
  pubTopic: 'Topic/Speaker',
  port: process.env.PORT || 5000,
  type: process.env.NODE_ENV || 'production',
  logFolder: './logs',
  cacheControl: process.env.NODE_ENV === 'development' ? false : true
};

module.exports = settings;