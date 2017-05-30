const _ = require('lodash');
const mongoose = require('mongoose');
const User     = mongoose.model('User');
const ChatMsg  = mongoose.model('ChatMsg');
const OTORoom  = mongoose.model('OTORoom');
const Group    = mongoose.model('Group');
const util = require('util');
require('./lib.event');
const resGenerator = require('../lib/resGenerator');

var io = "";
var socket = "";
var onlineUser = [];
var ioServer = function(app) {
    const server = require('http').Server(app);
    io = require('socket.io')(server);
    ioEvents(io);
    return server;
};


//chat message event
var ioEvents = function (io) {
    var group   = io.of('/group');
    var private = io.of('/chat');
    ///////////////////////////////////////////////////////////////////////
    group.on('connection',function (socket) {
       //group message event
        socket.on('chat message', function (msg) {
            SaveChatMsg(msg, function (savedMessage) {
                group.in(socket.room).emit('chat message', savedMessage);
            });
        });
        //create new group event
        socket.on('create_new_group', function (option) {
            StartCreateGroup(option);
        });

        socket.on('get_user_group',function(){
            getGroupList(function (grouplist) {
                group.to(socket.id).emit('get_user_group',grouplist);
            })
        });

        //while user typing the messages,it broadcast the typing event
        socket.on('typing',function (messagebody) {
            socket.to(socket.room).emit('typing', messagebody);
        });

        socket.on('get_group_last_message',function (groupId) {
            getGroupLastMessage(groupId,function (message) {
                group.to(socket.id).emit('get_group_last_message_success',{requestGroupId:groupId,message:message});
            })
        });
        //group joining event
        socket.on('join_room',function (roomId) {
           socket.leave();
           socket.room = roomId;
           socket.join(roomId,function () {
               socket.emit('join_room_success',roomId);
           });
        });

        //get old chat
        socket.on('get_old_chat',function (option) {
            getOldMessageForGroup(option,function (result) {
                socket.emit('get_old_chat',result);
            });
        });
        eventManage.on('group_created',function (object) {
            group.to(socket.id).emit('create_new_group_success',object);
        });
    }); // group on connection ends here


/////////////////////////////////////////////////////////////////////////////
    private.on('connection', function (socket) {
        socket.on('chat message', function (msg) {
            SaveChatMsg(msg,function (savedMessage) {
                private.to(socket.room).emit('chat message',savedMessage);
            });
            // io.emit('chat message', savedMessage);
        });
         //while user typing the messages,it broadcast the typing event
         socket.on('typing',function (messagebody) {
             private.to(socket.room).emit('typing', messagebody);
         });

         //on first load of front end, it send the current online user list
        //it also finds the last message between two user who are online
         socket.on('get_online_user',function(){
                 private.to(socket.id).emit('online_user',onlineUser);
         });

         //when new user joins, it emits to update the current online user list
         socket.on('user_joined',function(userID){
             addUser(userID,socket,function () {
                 socket.emit('user_join_success',userID);
                 io.of('/chat').emit('online_user',onlineUser);
             });
         });

         //retrives old chat from the database
         socket.on('get_old_chat',function (param) {
             getOldMessage(param,function (result) {
                 private.to(socket.id).emit('get_old_chat',result);
             });
         });

         socket.on('join_room',function (options) {
           //leave room before joining in
           socket.leave(socket.room);
           //finding out the appropriate room based upon the members of the room
             //room name is created using the combination os the two user who is the exclusive member of that room
             //while requesting for the room, all combination is matched to find out room id
             OTORoom.findOne()
                 .and([
                     { $or: [{roomIdA: options.hostId+options.remoteId}, {roomIdB: options.hostId+options.remoteId}] },
                     { $or: [{memberA: options.hostId}, {memberA: options.remoteId}] },
                     { $or: [{memberB: options.hostId}, {memberB: options.remoteId}] }
                 ])
                 .exec(function (err, results) {
                     if(err)
                     {

                         console.log(err)
                     }
                     else if(results === null || results === undefined || results === "") {
                         //The room is created of that two user if it does not exists
                          newOTORoom = new OTORoom({
                              roomIdA : options.hostId+options.remoteId,
                              roomIdB : options.remoteId+options.hostId,
                              memberA : options.hostId,
                              memberB : options.remoteId
                         });
                          newOTORoom.save(function (err,newRoom) {
                              if(err)
                              {
                                  console.log(err)
                              }
                              else
                              {   //setting the newly saved room as chat room
                                  socket.room = newRoom._id;
                                  socket.join(socket.room);
                                  socket.emit('join_room_success', newRoom._id);
                              }

                          })
                     }
                     else
                     {   //setting the room which is already exists
                         socket.room = results._id;
                         socket.join(socket.room,function () {
                             socket.emit('join_room_success', results._id);

                         })
                     }
                 });
         });

         socket.on('get_last_message',function (option) {
             getLastMessage(option,function (oldOption,lastMessageObject) {
                 private.to(socket.id).emit('get_last_message_success',{option:oldOption,message:lastMessageObject});
             })
         });

         socket.on('disconnect',function(){
             //on disconnect using the socket id,identify that user and remove from list
             if (_.findIndex(onlineUser, ['socketID', socket.id]) != null) {
                 _.remove(onlineUser, {socketID: socket.id});
                 //fire a event to update online user list at client side
                 io.of('/chat').emit('online_user',onlineUser);
             }
         });
    });

    eventManage.on('user_joined',function(){
        private.emit('get_online_user',onlineUser);
    });

    eventManage.on('error',function (errorObject) {
        private.emit('error',errorObject);
    });


   eventManage.on('group_creation_failure',function (object) {
       socket.emit('group_creation_failure',object);
   })

};

//Retrieve chat message from database for private chat
function getOldMessage(options,callback)
{
    ChatMsg.find({})
        .select('-_id -__v')
        .where('messageRoom').equals(options.roomId)
        .sort('-date')
        .skip(options.skip)
        .lean()
        .limit(options.limit)
        .exec(function (err,result) {
            if(err)
            {
                console.log(err);
            }
            else
            {
                callback(result);
            }
        })
}

//Retrieve chat message from database for private chat
function getOldMessageForGroup(options,callback)
{
    ChatMsg.find({})
        .select('-_id -__v')
        .where('groupid').equals(options.roomId)
        .sort('-date')
        .skip(options.skip)
        .lean()
        .limit(options.limit)
        .exec(function (err,result) {
            if(err)
            {
                console.log(err);
            }
            else
            {
                callback(result);
            }
        })
}

//creating the array of online user
function addUser(userID,socket,callback) {
    var findUserQuery = User.findOne({_id:userID}).select('userID userFirstName userLastName');
    findUserQuery.exec(function (err,retrivedUser) {
        //creating custom user object
        if(err)
        {
            console.log("Error" +err);
        }
        else if(retrivedUser===null || retrivedUser===undefined || retrivedUser==="")
        {
              callback();
        }
        else {
            //the user array should contain unique entry of user
            index = _.findIndex(onlineUser, ['userId', retrivedUser._id]);
            if (index==-1) {
                userdata =
                    {
                        userId: retrivedUser._id,
                        userName: retrivedUser.userFirstName + " " + retrivedUser.userLastName,
                        socketID: socket.id
                    };
               onlineUser.push(userdata);
               callback();
            }
        }
    });
}


//save chat message function
function SaveChatMsg(messagebody,callback) {
    var newChatMsg = new ChatMsg({
        messageRoom     : messagebody.roomId,
        senderId        : messagebody.userid,
        receiverId      : messagebody.recieverId,
        msgFromUserName : messagebody.username,
        messageData     : messagebody.messagedata,
        groupid         : messagebody.groupID
    });

    newChatMsg.save(function(err,savedChat){
        if(err)
        {
            console.log(err);
        }
        else if(savedChat === null || savedChat === undefined || savedChat === "")
        {
            response = resGenerator.generate(true,500,null,"Error in saving messages to database");
            eventManage.emit('error',response);
        }
        else
        {
            callback(savedChat);
            // io.in(socket.room).emit('chatMessage', savedChat);
            //eventManage.emit('chatMessage' , savedChat);
        }
    });
}//end save chat message

////////////////////////////////////////////////////////////////////////////////////
//create new group
function StartCreateGroup(option)
{
    User.findById(option.userID,function (err,user) {
        if(err) console.log(err);
        else findGroup(option,user);
    })
}

//find out what are the group the user is member of
function findGroup(option,user) {
      GroupList = user.group.slice();
   if (_.findIndex(GroupList, ['GroupName', option.groupName]) === -1) createNewGroup(option,user);
    else
   {
       eventManage.emit('group_creation_failure',{message:'Group Crteration Failed'});

   }
}

 function createNewGroup(option,user)
 {
     newGrp = new Group({
         name : option.groupName,
         admin: option.userID,
         members:[option.userID]
     });
     newGrp.save(function (err,newcreatedGrp) {
         if(err) console.log(err);
         else
         {
             groupdata = {groupName : newcreatedGrp , groupId : newcreatedGrp._id};

             User.findById(user._id,function (err,result) {
                 if(err) console.log(err);
                 result.group.push(groupdata);
                 result.save(function (err,updatedUser) {
                     if(err) console.log(err);
                     else {eventManage.emit('group_created',{groupData:newcreatedGrp,userData:updatedUser});}
                 })
             })
         }
     })
 }

 function getGroupList(callback) {
     Group.find({})
         .select('-__v -messages')
         .sort('-date')
         .lean()
         .exec(function (err,result) {
             if(err) console.log(err);
             else callback(result);
         });
     }


function getLastMessage(option,callback) {
        ChatMsg.find({})
            .where('this.senderId+this.recieverId ==' + option.hostId + option.clientId + '|| this.senderId+this.recieverId=== ' + option.clientId+option.hostId)
            .select('-_id -__v')
            .sort('-date')
            .lean()
            .limit(1)
            .exec(function (err, result) {
                if (err) console.log(err);
                else if (result == null || result == undefined || result == "") {
                    callback(option,result[0]);
                }
                else {
                    callback(option,result[0]);
                }
            })
}

function getGroupLastMessage(groupId,callback)
{
    ChatMsg.find({})
        .select('-_id -__v')
        .where('groupid').equals(groupId)
        .sort('-date')
        .lean()
        .limit(1)
        .exec(function (err,result) {
            if(err) console.log(err);
            else if(result==""||result==null||result==undefined) callback(null);
            else callback(result[0]);
        })
}

exports = module.exports = ioServer;