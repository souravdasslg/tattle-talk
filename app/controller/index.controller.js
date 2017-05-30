var socket = require('socket.io');
var express = require('express');
var router = express.Router();
var auth = require('../../lib/lib.authvalidator');


exports.controller = function (app,passport) {

    //redirect to the chat page
    router.get('/',auth.isAuthenticated,function (req,res) {
        res.redirect('/chat');
    });

    //deliver the chat page
    router.get('/chat',auth.isAuthenticated,function (req,res){
        res.render('private-chat',{user:req.session.user});
    });

    //deliver the group chat page
    router.get('/group',auth.isAuthenticated,function (req,res){
        res.render('group-chat',{user:req.session.user});
    });

    app.use('/',router);
};
