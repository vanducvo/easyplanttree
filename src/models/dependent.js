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
    }
});
DependentSchema.index({user: 1});
module.exports =  mongoose.model('Dependent', DependentSchema);