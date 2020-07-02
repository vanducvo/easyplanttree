const mongoose = require('mongoose');
const Schema = mongoose.Schema
let DependentSchema = new Schema({
    motor: {
        ref: true,
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Device'
    },
    sensor: {
        ref: true,
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Device'
    },
    max: Number,
    min: Number
});

module.exports =  mongoose.model('Dependent', DependentSchema);