const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');


var Schema = mongoose.Schema;

var User = new Schema({
    userId : {
        type :String,
        unique :true
    },
    userFirstName : {
        type :String,
        default:""
    },
    userLastName : {
        type :String,
        default:""
    },
    email : {
        type :String,
        unique :true
    },
    phoneNumber : {
        type :String,
        default:""
    },
    password : {
        type :String,
        default:""
    },
    accountCreated : {
        type :Date,
        default:Date.now()
    },
    lastLogin : {
        type :Date,
        default:""
    },
    provider : {
        type :String,
        default:""
    },
    group : []
});

module.exports = mongoose.model('User',User);
