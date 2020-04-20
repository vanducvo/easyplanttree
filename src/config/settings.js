const settings = {
  port: process.env.PORT || 5000,
  type: process.env.NODE_ENV || 'dev',
  logFolder: './logs',
  cacheControl: process.env.NODE_ENV === 'development' ? false : true,
  csrf_secretkey: 'MC43NzM4NjAwNTg2OTM4MDAz',
  jwt_secretkey: 'MC40OTM3ODI4ODI4NjQ2Njgy',
  cryto_secretkey: 'MC40NjUxMTI5ODgxNTIwOTA4',
  database: 'mongodb+srv://easyplanttree:veryeasyplanttree@easyplanttreee-sotuj.mongodb.net/maindb?retryWrites=true&w=majority',
  email_partern:  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
};

const gmail = {
  credentials: {
    "installed": {
        "client_id": "288024865112-e1pvro9truj69deg5h3n36cj59cppahb.apps.googleusercontent.com",
        "project_id": "easyplanttree-1587344168575",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "eMqByeQxeJItWhXVd6tRkm4Q",
        "redirect_uris": [
            "urn:ietf:wg:oauth:2.0:oob",
            "http://localhost"
        ]
    }
  },
  token: {
    "access_token": "ya29.a0Ae4lvC2v6wYj5xank5J0vDXRGx8GTo4pZ_hg-IatWipFiqv0_oJhOPuTX3IpBiG92yBgC-aG7_qNJsyCxX5K63J2RFuVFwMTronOETgfSiRbAqyMkFrtq5DWEO5aGqtLrpBMT5WXmKWV9Vyx95Ry8FQnsLQlV1Zm8Lw",
    "refresh_token": "1//0gHSX642UHEQ4CgYIARAAGBASNwF-L9Ir33nLoVcO7P_T40ncWIeQIe3gACcDEi5E1GNt7mApadLqW8iz_L6PO0ZW65e1lqyw7fo",
    "scope": "https://www.googleapis.com/auth/gmail.compose",
    "token_type": "Bearer",
    "expiry_date": 1587348605734
  }
}

module.exports = settings;
module.exports.gmail = gmail;
