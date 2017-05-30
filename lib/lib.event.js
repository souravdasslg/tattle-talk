var EventEmitter = require('events').EventEmitter;
var eventManager = new EventEmitter();
global.eventManage = eventManager;

exports.loggedIn = function (user) {
    eventManager.emit('user_joined',user);
};


module.exports = exports;
