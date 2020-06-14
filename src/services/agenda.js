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

function cancel(id){
    return agenda.cancel({_id: ObjectId(id)});
}

module.exports.initAgenda = initAgenda;
module.exports.getAgenda = getAgenda;
module.exports.addSchedule = addSchedule;
module.exports.once = once;
module.exports.getHistory = getHistory;
module.exports.getFuture = getFuture;
module.exports.cancel = cancel;