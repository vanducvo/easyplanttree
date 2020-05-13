const mqtt = require('mqtt');
const serverLogger = require('../utils/logger').serverLogger(module);
var client = null;

function connect(info, subtopic, pubtopic, url){
    if(client){
        return client;
    }

    client = mqtt.connect(url, {
        clientId: info.id,
        username: info.username,
        password: info.password
    });

    client.on('connect', () => {
        client.subscribe(subtopic, function(err){
            if(err){
                serverLogger.error(err);
            }
        });

        client.subscribe(pubtopic, function(err){
            if(err){
                serverLogger.error(err);
            }
        });
    });

    return client;
}

function getBroker(){
    if(client){
        return client;
    }
    serverLogger.error('Broker server is not connected');
}

exports.connect = connect;
exports.getBroker = getBroker;