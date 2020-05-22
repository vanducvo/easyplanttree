const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const compare = require('tsscmp');
const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const Device = require('../models/device');
/**
 * @description check mail valid
 * @param {string} email
 * @returns {boolean} valid mail?
 */
function checkEmail(email){
  return emailPattern.test(email);
}

/**
 * @description Create json text with beautiful
 * @param {Object} json
 * @returns {string} beautify json text
 */
function createTextResepondJSONBeaufy(json) {
  return JSON.stringify(json, null, '\t');
}

/**
 * @description Crypto data to protect
 * @param {string} data
 * @returns {string} data have crypto
 */
function promiseScrypt (data){
  return new Promise((resolve, reject) => {
    crypto.scrypt(data, process.env.CRYTO_SECRET_KEY, 64, function(err, key){
      if(err)
        reject(err);
      
      resolve(key.toString('hex'));
    });
  });
}

/**
 * @description Verify data have crypto prevent timing attacks 
 * @param {string} origindata 
 * @returns {boolean} valid data ? 
 */
function promiseVerifyScrypt(origindata, data){
  return promiseScrypt(origindata).then(key => {
    return compare(data, key);
  });
}

/**
 * @description sign data with jwt
 * @param {string} data
 * @return {string} tooken have sign 
 */
function jwtCreate(data){
  return jwt.sign(data, process.env.JWT_SECRET_KEY);
}

/**
 * @description sign data with jwt with expires
 * @param {string} data
 * @return {string} tooken have sign 
 */
function jwtCreateWithExpire(data, exprire){
  return jwt.sign(data, process.env.JWT_SECRET_KEY, {
    expiresIn: exprire
  });
}

/**
 * @description Verify jwt token
 * @param {string} data 
 * @returns {boolean} valid data ? 
 */
function jwtVerify(data){
  return new Promise((resolve, reject) => {
    jwt.verify(data, process.env.JWT_SECRET_KEY, function(err, decoded){
      if(err)
        reject(err);
      
      resolve(decoded);
    });
  })
}

function classifyDevice(data){
  if (
    !data.device_id || 
    typeof(data.device_id) !== 'string'||
    !data.value
    ){
    return;
  }
  let device = data.device_id.match(/^id(\d+)/);

  if(!device || device.length < 1){
    return;
  }

  device = device[1];

  if(data.value.length && data.value[0] === '0'){
    data.value = ['0'];
  }
  
  switch(device){
    case '4':
      return new Device.GPS(data);
    case '7':
      return new Device.SoilMoisture(data);
    case '9':
      return new Device.MotorSchema(data);
  }

  return;
}

function getTypeDevice(data){
  if (
    !data.device_id || 
    typeof(data.device_id) !== 'string'
    ){
    return;
  }
  let device = data.device_id.match(/^id(\d+)/);

  if(!device || device.length < 1){
    return;
  }

  device = device[1];

  switch(device){
    case '4':
      return 'gps';
    case '7':
      return 'sensor'
    case '9':
      return 'motor';
  }

  return;
}

exports.createTextResepondJSONBeaufy = createTextResepondJSONBeaufy;
exports.promiseScrypt = promiseScrypt;
exports.jwtCreate = jwtCreate;
exports.jwtVerify = jwtVerify;
exports.jwtCreateWithExpire = jwtCreateWithExpire;
exports.promiseVerifyScrypt = promiseVerifyScrypt;
exports.checkEmail = checkEmail;
exports.classifyDevice = classifyDevice;
exports.getTypeDevice = getTypeDevice;