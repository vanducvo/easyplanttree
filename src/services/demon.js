const serverLogger = require('../utils/logger').serverLogger(module);
const {forceAPI, getTypeDevice} = require('../utils/utils');
const Agenda = require('./agenda');

function createDBSaver(client, traceTopic, classifyCollection){
    client.on('message', (topic, message) => {
        if(topic !== traceTopic){
            return;
        }

        let data = message.toString();
        
        try{
            data = JSON.parse(data);
            data = forceAPI(data);
        } catch(err){
            serverLogger.error(err);
            return;
        }

        let collection = classifyCollection(data);
        if(collection && collection.save){
            
            collection.save();
        }
    });
}

function dashBoardUpdate(io, client, traceTopic, getDevices){
    io.of('/dashboard').on('connection', (socket) => {
        let user = socket.request.headers.cookie.match(/jwt=([^;]*)/)[1];
        getDevices(user).then(docs => {
            let devices = docs.reduce((mapper, doc) => 
                mapper.set(doc.device_id, true), new Map()
            );

            let sender = (topic, message) => {
                if(topic !== traceTopic){
                    return;
                }
        
                let data = message.toString();
                
                try{
                    data = JSON.parse(data);
                    data = forceAPI(data);
                } catch(err){
                    serverLogger.error(err);
                    return;
                }

                if(!devices.has(data.device_id)){
                    return;
                }
                socket.emit('new', data);
            };

            client.on('message', sender);

            socket.on('disconnect' , (socket) => {
                client.off('message', sender);
            });

        });

    });
}

function controllerUpdate(io, brige, getUser){

    io.of('/controller').on('connection', (socket) => {
        let jwt = socket.request.headers.cookie.match(/jwt=([^;]*)/)[1];
        let user = getUser(jwt);

        let sender = data => {
            if(data.data.user === user.id){
                socket.emit('watering', {
                    _id: data._id,
                    lastRunAt: data.lastRunAt,
                    data: data.data
                });
            }
        };

        brige.on('watering', sender);

        socket.on('disconnect', (socket) => {
            brige.off('watering', sender);
        });
    });
}

function autoWatering(client, traceTopic, pubTopic, getAutoWateringInfo, createPayload){
    client.on("message", function(topic, message){
        if(topic !== traceTopic){
            return;
        }

        let data = message.toString();
        
        try{
            data = JSON.parse(data);
            data = forceAPI(data);
        } catch(err){
            serverLogger.error(err);
            return;
        }

        if(getTypeDevice(data) !== "sensor"){
            return;
        }

        let info = getAutoWateringInfo(data);
        let value = Number(data.value[1]);
        info.then(doc => {
            if(!doc || !doc.length){
                return;
            }

            doc = doc[0];

            if(!doc.dependent || !doc.dependent[0]){
                return;
            }

            // When < Min
            if(value < doc.dependent[0].min){
                // Have watering or watering in 30s
                Agenda
                .getConflict(doc.motor[0].user, new Date(), "0.5", doc.motor[0].device_id)
                .then(isConflict => {
                    if(isConflict){
                        return;
                    }

                    let payloadStart = {
                        device_id: doc.motor[0].device_id,
                        intensity: "1000"
                    }
                    client.publish(pubTopic, createPayload(payloadStart) ,{qos: 2});

                    let payloadStop = {
                        device_id: doc.motor[0].device_id,
                        intensity: "0"
                    }

                    setTimeout( () => {
                        client.publish(pubTopic, createPayload(payloadStop) ,{qos: 2});
                    }, 20000);
                });
            }
            // When > Max
            if(value > doc.dependent[0].max){
                let payload = {
                    device_id: doc.motor[0].device_id,
                    intensity: "0"
                }
                client.publish(pubTopic, createPayload(payload) ,{qos: 2});
            }
        });
    });
}

exports.createDBSaver = createDBSaver;
exports.dashBoardUpdate = dashBoardUpdate;
exports.controllerUpdate = controllerUpdate;
exports.autoWatering = autoWatering;