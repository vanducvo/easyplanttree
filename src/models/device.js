const mongoose = require('mongoose');
const Schema = mongoose.Schema

let SoilMoistureSchema = new Schema({
    device_id: {
        required: true,
        type: String
    },
    value: {
        type: [String],
        required: function(){
            return  (
                        this.length == 1 &&
                        this[0] === '0'
                    ) 
                    ||
                    (
                        this.length === 2 &&
                        this[0] === '1' && 
                        0 <= Number(this[1]) && Number(this[1]) <= 1023
                    );
        }
    },
    time: {
        type: Date,
        default: Date.now
    }
});
SoilMoistureSchema.index({device_id: 1});
let SoilMoisture =  mongoose.model('SoilMoisture', SoilMoistureSchema);

let GPSSchema  = new Schema({
    device_id: {
        required: true,
        type: String
    },
    value: {
        type: [String],
        required: function(){
            return  (
                        this.length === 1 &&
                        this[0] === '0'
                    )
                    ||
                    (
                        this.length === 3 &&
                        this[0] === '1' &&
                        0 <= Number(this[1]) && Number(this[1]) <= 360 &&
                        0 <= Number(this[2]) && Number(this[2]) <= 360
                    );
        }
    },
    time: {
        type: Date,
        default: Date.now
    }
});
GPSSchema.index({device_id: 1});
let GPS =  mongoose.model('GPS', GPSSchema);

let MotorSchema = new Schema({
    device_id: {
        required: true,
        type: String
    },
    value: {
        type: [String],
        required: function(){
            return  (
                        this.length == 1 &&
                        this[0] === '0'
                    )
                    ||
                    (
                        this.length == 2 &&
                        this[0] === '1' &&
                        0 <= Number(this[1]) && Number(this[1]) <= 3
                    );
        }
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
    }
});
DeviceSchema.index({user: 1});
let Device =  mongoose.model('Device', DeviceSchema);

module.exports.SoilMoisture = SoilMoisture;
module.exports.GPS = GPS;
module.exports.MotorSchema = Motor;
module.exports.Device = Device;