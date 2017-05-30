var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema;
var ChatMsg = new Schema({
    messageRoom     : {type:String,required:true},
    messageRoomId   : {type:String},
    senderId        : {type:String},
    receiverId      : {type:String},
    msgFromUserName : {type:String},
    msgToUserName   : {type:String},
    messageData     : {type:String},
    groupid         : {type:String,default:""},
    date            : {type:Date, default:Date.now}
});
ChatMsg.plugin(mongoosePaginate);
mongoose.model('ChatMsg',ChatMsg);
