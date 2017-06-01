//passport configuration
var mongoose =  require('mongoose');
var facebookStrategy = require('passport-facebook').Strategy;
var googleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var LocalStrategy    = require('passport-local').Strategy;

var User = mongoose.model('User');

module.exports = function (passport) {
    //passport Configuration
//**Facebook Authentication Configuration
    passport.use(new facebookStrategy({
            clientID: '364266763958779',
            clientSecret: 'ea2b29f0dee3827fdf1ff93009b42d08',
            callbackURL: 'http://chat.shortscope.com/login/facebook/return',
            profileFields: ['id', 'emails', 'name']
        },
        function(accessToken, refreshToken, profile, cb) {
            cb(null, profile);
        }));

//**Google Authentication Configuration
    passport.use(new googleStrategy({
            clientID: '983797450356-1itktuj6nmn3adq6pcopcreis56p73th.apps.googleusercontent.com',
            clientSecret: 'kVBVyWDd5HC5iCUGp_uJEjq9',
            callbackURL: 'http://chat.shortscope.com/login/google/return'
        },
        function(accessToken, refreshToken, profile, cb) {
            cb(null, profile);
        }));
    //**Local Authentication Configuration
    passport.use('LocalStrategy',new LocalStrategy({
        usernameField : 'email',
        passwordField : 'login_password',
        passReqToCallback : true
        },
        function(req, email, password, done) {
        console.log(email);

            User.findOne({ email: req.body.login_email}, function (err, user) {
                console.log(user);
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (!user.validPassword(req.body.login_password)) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            });
        }
    ));

    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });

    passport.deserializeUser(function(obj, cb) {
        cb(null, obj);
    });

    return passport;
};
