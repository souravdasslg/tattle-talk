const express = require('express');
const mongoose = require('mongoose');
const router  = express.Router();


//Importing user model
 const User = mongoose.model('User');

//event manager
const eventManager = require('../../lib/lib.event');

 exports.controller = function(app,passport){

    router.get('/',function (req,res) {
       res.render('login');
    });

    router.get('/auth/google',passport.authenticate('google',{ scope : ['profile', 'email'] }));

    router.get('/google/return',passport.authenticate('google'),function(req,res){
        User.findOne({'email' : req.user.emails[0].value},{password : 0},function(err,user){
            if(err)
            {
                console.log(err);
                res.render(error,{error:error});
            }
            if(!user || user == "" || user == undefined)
            {
                    newUser = new User({
                    userId     : req.user.id,
                    userFirstName  : req.user.name.givenName,
                    userLastName   : req.user.name.familyName,
                    email          : req.user.emails[0].value,
                    accountCreated : Date.now(),
                    provider       : "Google"
                });
                newUser.save(function(err,user){
                    if(err)
                    {
                        console.log(err);
                        res.render(error,{error:error});
                    }else{


                        //save last login time for first time login
                        user.lastLogin = Date.now();
                        user.save(function(err,user)
                        {
                            if(err)
                            {
                                console.log(err);
                                res.render(error,{error:error});

                            }
                            else
                            {
                                req.session.user = user;
                                res.redirect('http://localhost:3000/chat');
                                eventManager.loggedIn(user);
                            }
                        })
                    }
                })//end save
            }//end if
            else{
                user.lastLogin = Date.now();
                user.save(function(err,user)
                {
                    if(err)
                    {
                        res.render(error,{error:error});
                    }
                    else{
                        req.session.user = user;
                        eventManager.loggedIn(user);
                        res.redirect('http://localhost:3000/chat');


                    }
                })
            }//end else
        });
    });



    app.use('/login',router);
};
