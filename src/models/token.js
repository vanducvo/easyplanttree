const mongoose = require('mongoose');

// Schema for Token collection
const tokenSchema = mongoose.Schema({
    ip: {
        type: String,
        required: true
    },
    browser: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true
    },
    pusher: String
});

// Create index with user id
tokenSchema.index({user: 1});

module.exports = mongoose.model('Token', tokenSchema);