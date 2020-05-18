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

exports.createDBSaver = createDBSaver;