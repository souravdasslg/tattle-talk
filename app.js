//initialize modules
const bodyparser    = require('body-parser');
const cookieParser  = require('cookie-parser');
const express       = require('express');
const session       = require('express-session');
const fs            = require('fs');
const favicon       = require('serve-favicon');
const morgan        = require('morgan');
const passport      = require('passport');
const path          = require('path');
const app           = express();

//initialize custom modules

var db = require('./config/db-config.js');
var appRootDir =process.env.PWD;
app.use(bodyparser.json({limit:'10mb',extended:true}));
app.use(bodyparser.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());
app.use(morgan('dev'));
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'app/views'));
app.use(express.static(__dirname + '/public'));
//Setting up session
app.use(session({
    name :'AppCookie',
    secret: 'ALongSecretKeyForMakingTheCookieSecure'+Date.now(),
    resave: true,
    httpOnly : true,
    saveUninitialized: true,
    cookie: { secure: false }
}));

//passport initialization
app.use(passport.initialize());
app.use(passport.session());

//Importing all models
const modelDir = appRootDir+'/app/model/';
fs.readdirSync(modelDir).forEach(function(file){
    if(path.extname(file) === '.js'){
        require(modelDir+file);
    }
});

var route;
const controllerDir = appRootDir+'/app/controller/';
//Importing all router in the
fs.readdirSync(controllerDir).forEach(function(file){
    if(path.extname(file) === '.js'){
        route = require('./app/controller/'+file);
        route.controller(app,passport);
    }
});
require('./config/auth-config')(passport);
var ioServer = require(appRootDir+'/lib/lib.socket')(app);

ioServer.listen(3000,function () {
    console.log('Server is Live');
});
