var socket = require('socket.io');
var express = require('express');
var router = express.Router();
var auth = require('../../lib/lib.authvalidator');


exports.controller = function (app,passport) {

    router.get('/',auth.isAuthenticated,function (req,res) {
        req.session.destroy();
        req.logout();
        res.redirect('/login')
    });

    app.use('/logout',router);
};
