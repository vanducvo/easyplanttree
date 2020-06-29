function watering(brige, client, topic, createPayload){
    return function innerWatering(job, done){
        let info = job.attrs.data;
        let payload = createPayload(info);

        for(let i = 0; i < 5; i++){
            client.publish(topic, payload ,{qos: 2});
        }
        
        brige.emit('watering', job.attrs);
        
        done();
    }
}

function stopWatering(client, topic, createPayload){
    return function innerStopWatering(job, done){
        let info = job.attrs.data;
        let payload = createPayload(info);

        for(let i = 0; i < 5; i++){
            client.publish(topic, payload ,{qos: 2});
        }

        done();
    }
}

module.exports.watering = watering;
module.exports.stopWatering = stopWatering;