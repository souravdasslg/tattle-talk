//Database Configuration
var mongoose = require('mongoose');
var logger  = require('winston');

var url = "mongodb://localhost/chatstorage";
mongoose.connect(url);

mongoose.connection.once('open', function() {
    logger.log('info','MongoDB event open');
    logger.log('debug','MongoDB connected [%s]', url);

    mongoose.connection.on('connected', function() {
        logger.log('info','MongoDB event connected');
    });

    mongoose.connection.on('disconnected', function() {
        logger.log('warn','MongoDB event disconnected');
    });

    mongoose.connection.on('reconnected', function() {
        logger.log('info','MongoDB event reconnected');
    });

    mongoose.connection.on('error', function(err) {
        logger.log('error','MongoDB event error: ' + err);
    });


});