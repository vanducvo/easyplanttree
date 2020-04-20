const mongoose = require('mongoose');
const settings = require('../config/settings');

const UserSchema = mongoose.Schema({
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
            validator: function(value){
                return settings.email_partern.test(value)
            },
            message: props => `${props.value} is not a valid email!`
        }
        ,
        required: true,
        unique: true
    }
});

UserSchema.index({email: 1});


module.exports = mongoose.model('User', UserSchema);