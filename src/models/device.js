const mongoose = require('mongoose');
const Schema = mongoose.Schema

let SoilMoistureSchema = new Schema({
    device_id: {
        required: true,
        type: String
    },
    value: {
        type: [String],
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    }
});
SoilMoistureSchema.index({device_id: 1});
let SoilMoisture =  mongoose.model('SoilMoisture', SoilMoistureSchema);

let MotorSchema = new Schema({
    device_id: {
        required: true,
        type: String
    },
    value: {
        type: [String],
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    }
});
MotorSchema.index({device_id: 1});
let Motor =  mongoose.model('Motor', MotorSchema);

let DeviceSchema = new Schema({
    device_id: {
        required: true,
        type: String
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    lat: String,
    long: String
});
DeviceSchema.index({user: 1});
let Device =  mongoose.model('Device', DeviceSchema);


let WateringSchema = new Schema({
    device_id: {
        required: true,
        type: String
    },
    value: {
        type: [String],
        required: function(){
            return (
                this.length == 1 && this[0] === '0'
                ) || (
                    this.length == 3 &&
                    this[0] == 1 &&
                    0 <= Number(this[1]) && Number(this[1]) <= 3 &&
                    0 <= Number(this[2])
                )
        }
    },
    time: {
        type: Date,
        default: Date.now
    }
});
WateringSchema.index({device_id: 1});
let Watering =  mongoose.model('Watering', WateringSchema);


module.exports.Watering = Watering;

module.exports.SoilMoisture = SoilMoisture;
module.exports.MotorSchema = Motor;
module.exports.Device = Device;
