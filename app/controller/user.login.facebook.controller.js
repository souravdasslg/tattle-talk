//initialize the required libraries
var express  = require('express');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var router   = express.Router();

var eventManager = require('../../lib/lib.event');
exports.controller = function(app,passport) {

    //facebook login
    router.get('/auth/fb', passport.authenticate('facebook', {scope: ['email']}));

    //facebook login validation
    router.get('/facebook/return', passport.authenticate('facebook'), function (req, res) {
            //takes the data from the facebook api and search it in local database
            //{password : 0} omits the password field while retriving data from user model
            User.findOne({'email': req.user.emails[0].value}, {password: 0}, function (err, user) {
                //checks for database error
                if (err) {
                    console.log(err);
                    res.render(error,{error:error});
                }
                //checks if database sends some unexpected results or blank result
                //depends upon that new user record is created
                if (!user || user == "" || user == undefined) {
                     newUser = new User({
                         userId: req.user.id,
                         userFirstName: req.user.name.givenName,
                         userLastName : req.user.name.familyName,
                         email: req.user.emails[0].value,
                         accountCreated: Date.now(),
                         provider: "facebook"
                    });
                    newUser.save(function (err, user) {
                        if (err) {
                            console.log(err);
                            res.render(error,{error:error});
                        }
                        else {
                            //send the entire user object to API Consumer
                            req.session.user = user;
                            res.redirect('http://localhost:3000/chat');
                        }
                    });//end save
                } else {
                    // if user is already present
                    //save last login time
                    user.lastLogin = Date.now();
                    user.save(function (err, user) {
                        if (err) {
                            console.log(err);
                            res.render(error,{error:error});
                        }
                        else {
                            req.session.user = user;
                            res.redirect('http://localhost:3000/chat');
                            eventManager.loggedIn(user);
                        }
                    });
                }
            });
    });

    app.use('/login', router);
};