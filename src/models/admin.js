const mongoose = require('mongoose');
const {checkEmail} = require('../utils/utils');

// Schema for user collection
const AdminSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        validate: {
            validator: checkEmail,
            message: props => `${props.value} is not a valid email!`
        }
        ,
        required: true,
        unique: true
    }
});

// Create email index
AdminSchema.index({email: 1});

module.exports = mongoose.model('Admin', AdminSchema);