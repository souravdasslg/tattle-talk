$(function () {
    var socket = io('/group');
    var i=5;
    var messagebody = {};
    var messageCount = 0;
    var clientId = $('#userid').val();
    var groupID ="";
    var activeRoomId ="";
    var options ={};
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
    $('#input').focus();
    messagebody ["username"] = $('#username').val();
    messagebody ["userid"] = $('#userid').val();
    $('#typing').text("");
    $('#send').click(function(){
        messagebody ["roomId"] = activeRoomId;
        messagebody ["recieverId"] = "";
        messagebody ["messagedata"] = $('#input').val();
        messagebody ["groupID"] = groupID;
        socket.emit('chat message', messagebody);
        $('#input').val('');
        return false;
    });

    socket.on('connect',function () {
        socket.emit('get_user_group');
        socket.emit('user_joined',clientId);
    });

    socket.on('chat message', function(recievedMessageBody){
        messageCount += 1;
        if(recievedMessageBody.senderId === clientId) {
            socket.emit('get_group_last_message',groupID);
            $('#chat_box').append($('<li class="right clearfix">' +
                '<span class="chat-img pull-right">' +
                '<img src="http://bootdey.com/img/Content/user_1.jpg" alt="User Avatar"> ' +
                '</span> ' +
                '<div class="chat-body clearfix"> ' +
                '<div class="header"> ' +
                '<strong class="primary-font">'+recievedMessageBody.msgFromUserName+'</strong> ' +
                '<small class="pull-right text-muted">' +
                '<i class="fa fa-clock-o"></i>'+recievedMessageBody.date+'</small> ' +
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
                '<i class="fa fa-clock-o"></i> ' +
                '12 mins ago</small> ' +
                '</div>' +
                ' <p>'+recievedMessageBody.messageData+' </p>' +
                '</div>' +
                '</li>'));
        }

        // $('#typing').delay(1000).hide();

        $('#chat_box').scrollTop($('#chat_box').prop('scrollHeight'));
    });

    $( '#input' ).keypress(function(e) {

        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            messagebody ["roomId"] = activeRoomId;
            messagebody ["recieverId"] = "";
            messagebody ["messagedata"] = $('#input').val();
            messagebody ["groupID"] = groupID;
            socket.emit('chat message', messagebody);
            $('#input').val('');
        }else {
            socket.emit('typing',messagebody);
        }
    });

    socket.on('typing', function (messagebody) {
        userId = $('#userid').val();
        typingElement = $('<li></li>').attr('id',userId).text(messagebody.username + " is typing...");
        $(typingElement).appendTo('#typing')
            .hide()
            .fadeIn(100)
            .delay(1000)
            .fadeOut(1000)
            .queue(function() {
                $(this).remove();
            });

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
                    '<i class="fa fa-clock-o"></i>'+chatMessages[message].date+'</small> ' +
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
                    '<i class="fa fa-clock-o"></i> ' +
                    '12 mins ago</small> ' +
                    '</div>' +
                    ' <p>'+chatMessages[message].messageData+' </p>' +
                    '</div>' +
                    '</li>'));
            }

        }//for loop ends here
    });

    //on scroll load more old-chats.
    $('#chat_box').scroll(function(){
        if($('#chat_box').scrollTop() == 0){
            options =
                {
                    roomId : activeRoomId,
                    messageCount : messageCount,
                    limit : 6,
                    skip :messageCount
                };
            socket.emit('get_old_chat',options);
        }

    }); // end of scroll event.

    // Log a message
    function log (message) {
        var $el = $('<li>').addClass('log').text(message);
        $('#chat_box').append($el);
    }

    socket.on('get_user_group',function (groupList) {
        $('#friend-list').empty();
        $('#online_user_list').text(function () {
      if(groupList.length>0)
      {
          for(group in groupList)
          {
              socket.emit('get_group_last_message',groupList[group]._id);
              $('#friend-list').append($('<li class="group_id" id=\"'+groupList[group]._id+'\">' +
                  '<a href="#" class="clearfix">' +
                  '<img src="http://bootdey.com/img/Content/user_1.jpg" alt="" class="img-circle">' +
                  '<div class="friend-name">' +
                  '<strong>' + groupList[group].name+'</strong>' +
                  '</div>' +
                  '<div class="last-message text-muted"></div>' +
                  '<small class="time text-muted"></small>' +
                  '<small class="chat-alert label label-danger"></small>' +
                  '</a>' +
                  '</li>'));
          }
          return "Groups (" + (groupList.length) + ")";
      }
    }).css("color","blue")
    });

    socket.on('get_group_last_message_success',function(object){
        console.log(object);
        if(object.message)
        {
            $("#"+object.message.groupid+" .last-message").text(object.message.messageData);
            $("#"+object.message.groupid+" .time").text(function () {
                return  moment(object.message.date).fromNow()
            });
            $("#"+object.message.groupid).prependTo("#friend-list");
        }
        else
            {
                $("#"+object.requestGroupId+" .last-message").text("No conversation started yet...");
            }

    });
    $('#new_grp_btn').click(function () {
        groupname = $('#grp_name').val()
        $('#grp_name').val('');
        option =
            {
                userID : clientId,
                groupName : groupname
            };
        socket.emit('create_new_group',option);
        return false;
    });

    socket.on('create_new_group_success',function () {
        $('#grp_name_modal').modal('toggle');
        socket.emit('get_user_group');
    });

    socket.on('create_new_group_faliure',function () {
        $('#grp_name_modal').modal('toggle');
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
        if(userID==clientId)
        {
            log('You are Connected');
            socket.emit('get_online_user');
        }
    });
    socket.on('reconnect_error', function () {
        $('#online_user_list').text(function () {
            return "Reconnecting...("+i+")";
        }).css("color","#0925A4");
        i++;
    });

    $('#offline').click(function (event) {
        event.preventDefault();
        val = $('#offline').attr('value');
        if (val == 0) {
            socket.disconnect();
            $('#offline').attr('value', '1').text("Go Online");
        } else {
            socket.open();
            $('#offline').attr('value', '0').text("Go Offline");
        }
         });
    $('#refresh').on('click',function () {
        socket.disconnect();
        socket.connect();
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

    $(document).on('click','li',function() {
        groupID = $(this).attr('id');
        $('#chat_box').empty();
        socket.emit('join_room',groupID);
    });

    $('#logout').click(function () {
        socket.disconnect();
        window.location.replace('/logout');
    });

});
