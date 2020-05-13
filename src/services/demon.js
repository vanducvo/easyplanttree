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
        console.log(data);
        let collection = classifyCollection(data);
        console.log(collection);
        if(collection && collection.save){
            collection.save();
        }
    });
}

exports.createDBSaver = createDBSaver;