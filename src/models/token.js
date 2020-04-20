const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    browser: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    }
});

tokenSchema.index({user: 1});

module.exports = mongoose.model('Token', tokenSchema);