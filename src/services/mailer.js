const mailComposer = require('nodemailer/lib/mail-composer');
const {google} = require('googleapis');
const {gmail} = require('../config/settings');
const {logger} = require('../utils/utils');
const {Base64} = require('js-base64');

async function mailer(name, compose){

    function authorize(credentials, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);
    
        oAuth2Client.setCredentials(gmail.token);
        callback(oAuth2Client);
    }
  
    function sendmail(auth) {
      const gmail = google.gmail({version: 'v1', auth});
      const mail = new mailComposer({
        from: `${name} <easyplanttree@gmail.com>`,
        ...compose
      });
    
      mail.compile().build(function(err, message){
        gmail.users.messages.send({
          auth: auth,
          userId: 'me',
          requestBody: {
            raw: Base64.encodeURI(message)
          }
        }).catch(logger.error);
      });
    }

    return authorize(gmail.credentials, sendmail);
}

module.exports = mailer;