function watering(brige, client, topic, createPayload){
    return function innerWatering(job, done){
        let info = job.attrs.data;
        let payload = createPayload(info);

        for(let i = 0; i < 5; i++){
            client.publish(topic, payload ,{qos: 2});
        }
        
        brige.emit('watering', job.attrs);
        
        job.agenda.schedule(
            `${info.watering_time} minutes`,
            'stop_watering', 
            {
                watering: job.attrs._id,
                device_id: info.device_id,
                intensity: "0"
            }
        );
 
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