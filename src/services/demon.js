const serverLogger = require('../utils/logger').serverLogger(module);

function createDBSaver(client, traceTopic, classifyCollection){
    client.on('message', (topic, message) => {
        if(topic !== traceTopic){
            return;
        }

        let data = message.toString();
        
        try{
            data = JSON.parse(data);
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

exports.createDBSaver = createDBSaver;
exports.dashBoardUpdate = dashBoardUpdate;