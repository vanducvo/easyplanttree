// Agenda Library
const Agenda = require('agenda');
const serverLogger = require('../utils/logger').serverLogger(module);
const ObjectId = require('mongoose').Types.ObjectId;
// Agenda instance
var agenda;

async function initAgenda(url){
    if(agenda){
        return agenda;
    }

    agenda = new Agenda();
    agenda.database(url, 'agenda', { useUnifiedTopology: true });
    await agenda.start();
    return agenda;
}

function getAgenda(){
    if(agenda){
        return agenda;
    }

    serverLogger.error('Schedule need create before get');
}

function addSchedule(name, job){
    agenda.define(name, job);
}

async function once(time, name, data){
    let job = await agenda.schedule(time, name, data);
    await job.save();
    return job.attrs;
}

function getHistory(user){
    return agenda.jobs({
        name: 'watering',
        nextRunAt: null, 
        "data.user": user
    }, {lastRunAt: -1}, 10);
}

function getFuture(user){
    return agenda.jobs({
        name: 'watering',
        nextRunAt: { "$ne": null},  
        "data.user": user
    }, {nextRunAt: 1});
}

async function getConflict(user, date, watering_time, device_id){
    let start = new Date(date);
    let end = new Date(start.getTime() + Number(watering_time)*60000);

    let simple = await agenda.jobs({
        "data.user": user,
        "data.device_id": device_id,
        nextRunAt: {
            "$lt": end,
            "$gt": start
        }
    });

    if(!simple.length){
        // Complex case
        let advance = await agenda.jobs({
            name: "stop_watering",
            "data.user": user,
            "data.device_id": device_id,
            nextRunAt: {
                "$gte": end
            }
        });

        for(let i of advance){
            let i_start = await agenda.jobs({
                _id: i.attrs.data.watering
            });

            if(i_start[0].attrs.nextRunAt < end){
                return true;
            }
        }

        return false;

    } else {
        return true
    }
}

function cancel(id){
    return Promise.all([
        agenda.cancel({_id: ObjectId(id)}),
        agenda.cancel({"data.watering": ObjectId(id)})
    ]);
}

module.exports.initAgenda = initAgenda;
module.exports.getAgenda = getAgenda;
module.exports.addSchedule = addSchedule;
module.exports.once = once;
module.exports.getHistory = getHistory;
module.exports.getFuture = getFuture;
module.exports.cancel = cancel;
module.exports.getConflict = getConflict;