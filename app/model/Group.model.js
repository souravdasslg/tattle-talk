var mongoose = require('mongoose');
var Schema = mongoose.Schema;


//design of group schema
var Group = new Schema({
    name : {
        type: String,
        default : ""
    },
    admin : {
        type: String,
        default:"" },

    createdOn : {
        type : Date,
        default : Date.now
    },
    members  : [],
    messages : []
});

mongoose.model('Group',Group);