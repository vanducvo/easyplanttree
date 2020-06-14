const serverLogger = require('../utils/logger').serverLogger(module);
const {forceAPI} = require('../utils/utils');

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

                if(!devices.has(data.device_id)){
                    return;
                }
                socket.emit('new', data);
            });
        });

    });
}

function controllerUpdate(io, brige, getUser){
    io.of('/controller').on('connection', (socket) => {
        let jwt = socket.request.headers.cookie.match(/jwt=([^;]*)/)[1];
        let user = getUser(jwt);
        brige.on('watering', data => {
            if(data.data.user === user.id){
                socket.emit('watering', {
                    _id: data._id,
                    lastRunAt: data.lastRunAt,
                    data: data.data
                });
            }
        });
    });
}

exports.createDBSaver = createDBSaver;
exports.dashBoardUpdate = dashBoardUpdate;
exports.controllerUpdate = controllerUpdate;