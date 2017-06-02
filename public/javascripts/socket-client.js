$(function () {
    var socket = io('/chat');
    var i=0;
    var messagebody = {};
    var messageCount = 0;
    var clientId = $('#userid').val();
    var friendID ="";
    var activeRoomId ="";
    var options ={};
    //////////////////////////////JQUERY COMMANDS///////////////////////////////
    //get the moment js script
    $.getScript( "javascripts/moment.js" )
        .done(function( script, textStatus ) {
            moment().format();
        })
        .fail(function( jqxhr, settings, exception ) {
           console.log(jqxhr);
           console.log(exception);
           console.log(settings);
        });

    //Onload of page, the focus becames the input box
    $('#input').focus();
    //onload make the input box empty
    $('#typing').text("");
    //on click of "send" button send the message using emitting and event through socket.io
    $('#send').click(function(){
        //creating the message body using important parameters and the actual text
        messagebody ["username"] = $('#username').val();
        messagebody ["userid"] = $('#userid').val();
        messagebody ["roomId"] = activeRoomId;
        messagebody ["recieverId"] = friendID;
        messagebody ["messagedata"] = $('#input').val();
        //sending the message through socket.io
        socket.emit('chat message', messagebody);
        //empty the input box after sending message
        $('#input').val('');
        //updating the message at online user list
        socket.emit('get_last_message', {hostId: clientId, clientId: friendID});
        return false;
    });

    //on pressing enter send the message
    $( '#input' ).keypress(function(e) {
        // identifying the enter key
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            messagebody ["username"] = $('#username').val();
            messagebody ["userid"] = $('#userid').val();
            messagebody ["roomId"] = activeRoomId;
            messagebody ["recieverId"] = friendID;
            messagebody ["messagedata"] = $('#input').val();
            socket.emit('chat message', messagebody);
            $('#input').val('');
            //updating the message at online user list
            socket.emit('get_last_message', {hostId: clientId, clientId: friendID});
        }else {
            //if the button is not "enter" then we assume that user is typing.So emitting the
            //typing event
            messagebody ["username"] = $('#username').val();
            messagebody ["userid"] = $('#userid').val();
            messagebody ["roomId"] = activeRoomId;
            messagebody ["recieverId"] = friendID;
            socket.emit('typing',messagebody);
        }
    });

    socket.on('typing', function (messagebody) {
        userId = $('#userid').val();

        //checks if the current friend is sending any typing  event.
        if(messagebody.userid===friendID)
        {
            $('#typing').animate({opacity:1},function(){
                $(this).text(messagebody.username+" is typing....")
                    .animate({opacity:0});
            });
        }
        if(messagebody.recieverId===clientId)
            $("#"+messagebody.userid+" .chat-alert").text('typing...').fadeIn(500).fadeOut(500);
    });

    //when the user scrolls up for old chat
    $('#chat_box').scroll(function(){
        //checks the scrollbar position , whether it is top.
        if($('#chat_box').scrollTop() == 0){
            options =
                {
                    roomId : activeRoomId,
                    messageCount : messageCount,
                    limit : 6,
                    skip : messageCount
                };
            //emit events for getting old chat
            socket.emit('get_old_chat',options);
        }

    }); // end of scroll event.

//setting up the chat room on clicking on friend name
    $(document).on('click','li',function() {
        friendID = $(this).attr('id');
        requestRoomID = clientId+friendID;
        $('#chat_box').empty();
        options =
            {
                roomId   : requestRoomID,
                hostId   : clientId,
                remoteId : friendID

            };
        socket.emit('join_room',options);
    });

//////////////////////////////Socket Events////////////////////////////////////
    socket.on('connect',function () {
        socket.emit('user_joined',clientId);
    });



    socket.on('chat message', function(recievedMessageBody){
        messageCount += 1;
        $("#"+recievedMessageBody.senderId+" .chat-alert").text('');
        socket.emit('get_last_message', {hostId: clientId, clientId: recievedMessageBody.senderId});
        if(recievedMessageBody.senderId === clientId) {
          $('#chat_box').append($('<li class="right clearfix">' +
                '<span class="chat-img pull-right">' +
                '<img src="http://bootdey.com/img/Content/user_1.jpg" alt="User Avatar"> ' +
                '</span> ' +
                '<div class="chat-body clearfix"> ' +
                '<div class="header"> ' +
                '<strong class="primary-font">'+recievedMessageBody.msgFromUserName+'</strong> ' +
                '<small class="pull-right text-muted">' +
                '<i class="fa fa-clock-o"></i>'+moment(recievedMessageBody.date).fromNow()+'</small> ' +
                '</div> ' +
                '<p>'+recievedMessageBody.messageData+'</p> </div> ' +
                '</li>'));
        }
        else {
          $('#chat_box').append($('<li class="left clearfix">' +
              '<span class="chat-img pull-left">' +
              '<img src="http://bootdey.com/img/Content/user_3.jpg" alt="User Avatar">' +
              '</span> <div class="chat-body clearfix">' +
              '<div class="header">' +
              '<strong class="primary-font">'+recievedMessageBody.msgFromUserName+'</strong>'+
              '<small class="pull-right text-muted">' +
              '<i class="fa fa-clock-o"></i> '+ moment(recievedMessageBody.date).fromNow() +'</small> ' +
              '</div>' +
              ' <p>'+recievedMessageBody.messageData+' </p>' +
              '</div>' +
              '</li>'));
        }

        // $('#typing').delay(1000).hide();

        $('#chat_box').scrollTop($('#chat_box').prop('scrollHeight'));
    });




    socket.on('get_old_chat',function (chatMessages) {
        messageCount += 6;
       for(message in chatMessages)
       {
           if(chatMessages[message].senderId === clientId) {
               $('#chat_box').prepend($('<li class="right clearfix">' +
                   '<span class="chat-img pull-right">' +
                   '<img src="http://bootdey.com/img/Content/user_1.jpg" alt="User Avatar"> ' +
                   '</span> ' +
                   '<div class="chat-body clearfix"> ' +
                   '<div class="header"> ' +
                   '<strong class="primary-font">'+chatMessages[message].msgFromUserName+'</strong> ' +
                   '<small class="pull-right text-muted">' +
                   '<i class="fa fa-clock-o"></i>'+ moment(chatMessages[message].date).fromNow()+'</small> ' +
                   '</div> ' +
                   '<p>'+chatMessages[message].messageData+'</p> </div> ' +
                   '</li>'));

           }
           else {
               $('#chat_box').prepend($('<li class="left clearfix">' +
                   '<span class="chat-img pull-left">' +
                   '<img src="http://bootdey.com/img/Content/user_3.jpg" alt="User Avatar">' +
                   '</span> <div class="chat-body clearfix">' +
                   '<div class="header">' +
                   '<strong class="primary-font">'+chatMessages[message].msgFromUserName+'</strong>'+
                   '<small class="pull-right text-muted">' +
                   '<i class="fa fa-clock-o"></i> ' + moment(chatMessages[message].date).fromNow()+
                   '</small> ' +
                   '</div>' +
                   ' <p>'+chatMessages[message].messageData+' </p>' +
                   '</div>' +
                   '</li>'));
           }

       }//for loop ends here
    });


    // Log a message
    function log (message) {
        var $el = $('<li>').addClass('log').text(message);
        $('#chat_box').append($el);
    }

    //create the user list based upon the online user array at client side.
    socket.on('online_user',function (OnlineUserArray) {
        $('#friend-list').empty();
        $('#online_user_list').text(function () {
            if(OnlineUserArray.length>0)
            {
                for (user in OnlineUserArray) {
                    if (OnlineUserArray[user].userId !== clientId) {
                        socket.emit('get_last_message', {hostId: clientId, clientId: OnlineUserArray[user].userId});
                        $('#friend-list').append($('<li class="friend_id" id=\"' + OnlineUserArray[user].userId + '\">' +
                            '<a href="#" class="clearfix">' +
                            '<img src="http://bootdey.com/img/Content/user_1.jpg" alt="" class="img-circle">' +
                            '<div class="friend-name">' +
                            '<strong>' + OnlineUserArray[user].userName + '</strong>' +
                            '</div>' +
                            '<div class="last-message text-muted"></div>' +
                            '<small class="time text-muted"></small>' +
                            '<small class="chat-alert label label-danger" style="display: none">typing.....</small>' +
                            '</a>' +
                            '</li>'));
                    }
                }
                return "Online User(" + (OnlineUserArray.length-1) + ")";
            }
            else
            {
                return "No User Online";
            }
        }).css("color","blue");

    });

    socket.on('get_last_message_success',function (object) {
        if(object.option.hostId===clientId)
        {
            if(object.message!==null || object.message!==undefined || object.message!==""){
                $("#"+object.message.recieverId+" .last-message").text(object.message.messageData);
                $("#"+object.message.recieverId+" .time").text(function () {
                    return  moment(object.message.date).fromNow()
                });
                $("#"+object.message.recieverId).prependTo("#friend-list");

            }
            else
            {
                $("#"+object.option.clientId+" .last-message").text("Start conversation");
            }
        }

    });



     $('#offline').click(function (event) {
         event.preventDefault();
        val = $('#offline').attr('value');
        if(val==0)
        {
            socket.disconnect();
            $('#offline').attr('value','1').text("Go Online");
        }
        if(val==1)
        {
            socket.open();
            $('#offline').attr('value','0').text("Go Offline");

        }
     });


    $('#refresh').on('click',function () {
        socket.disconnect();
        socket.connect();
    });
    //Sockets event
    socket.on('disconnect', function () {
        $('#online_user_list').text(function () {
            return "Offline"
        }).css("color","red");
    });

    socket.on('reconnect', function () {
        i=0;
        $('#online_user_list').text(function () {
            return "Connected"
        }).css("color","orange");
        socket.emit('user_joined',clientId);
    });

    socket.on('user_join_success',function (userID) {
        socket.emit('get_online_user');
        if(userID==clientId)
        {
            $('#online_user_list').text(function () {
                return "Online"
            }).css("color","green");
            socket.emit('get_online_user');
        }
    });
    socket.on('reconnect_error', function () {
        $('#online_user_list').text(function () {
            return "Reconnecting...("+i+")";
        }).css("color","#0925A4");
        i++;
    });

    socket.on('join_room_success',function (roomID) {
        activeRoomId = roomID;
        messageCount = 0;
        options =
            {
                roomId : activeRoomId,
                messageCount : messageCount,
                limit : 6,
                skip : 0
            };
       socket.emit('get_old_chat',options);
    });

    $('#logout').click(function () {
        socket.disconnect();
        window.location.replace('/logout');
    });


});
