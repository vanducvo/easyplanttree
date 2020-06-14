function watering(brige, client, topic, createPayload){
    return function innerWatering(job, done){
        let info = job.attrs.data;
        let payload = createPayload(info);
        client.publish(topic, payload ,{qos: 2});
        brige.emit('watering', job.attrs);
        done();
    }
}

module.exports = watering;