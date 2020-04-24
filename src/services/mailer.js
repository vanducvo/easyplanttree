// Generate RFC822 formatted e-mail messages
const mailComposer = require('nodemailer/lib/mail-composer');
const {google} = require('googleapis');
const serverLogger = require('../utils/logger').serverLogger(module);
const {Base64} = require('js-base64');

// Info of easyplanttree@gmail.com
const token = require('../config/gmail/token.json');
const credentials = require('../config/gmail/credentials.json');

/**
 * Send mail from easyplanttree@gmail.com to user
 * @param {string} name 
 * @param {Object} compose 
 */
async function mailer(name, compose){

    function authorize(credentials, token, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);
    
        oAuth2Client.setCredentials(token);
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
        }).catch(serverLogger.error);
      });
    }

    return authorize(credentials, token, sendmail);
}

module.exports = mailer;