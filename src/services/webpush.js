const webPush = require('web-push');
const databaseLogger = require('../utils/logger').databaseLogger(module);
const Token = require('../models/token');

const options = {
    TTL: 60,
    vapidDetails: {
        subject: 'mailto: vanducvo.dev@gmail.com',
        publicKey: 'BGY4KYCXpNJmOxhgde2ir0DXcUm6FhplGVQWiE9Lb09gWMVqL2mdPfI_txlb75D-tqtKOMfs6UKB94Tp5hf54hw',
        privateKey: 'ylWDJSoUuTjF13Z9lta0OehhThiDKlXmBE54778oNr8'
    }

};

function webPusher(tokenId, payload) {
    Token.findOne({ _id: tokenId })
        .then(doc => {
            pushSubscription = JSON.parse(doc.pusher);
            webPush.sendNotification(pushSubscription, payload, options);
        }).catch(err => {
            databaseLogger.error(err);
        });
}

module.exports = webPusher;