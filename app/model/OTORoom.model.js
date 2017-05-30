var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var OTORoom = new Schema({
    roomIdA : {type:String,default:"",required:true},
    roomIdB : {type:String,default:"",required:true},
    memberA : {type:String,default:""},
    memberB : {type:String,default:""},
    message : [],
    lastActive : {type:Date,default:Date.now},
    createdOn : {type:Date,default:Date.now}

});

OTORoom.plugin(mongoosePaginate);
mongoose.model('OTORoom',OTORoom);
