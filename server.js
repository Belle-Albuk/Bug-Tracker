require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const ObjectId = require('mongodb').ObjectId;
const myDB = require('./connection');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {secure: false}
}))

app.use(passport.initialize());
app.use(passport.session());

myDB(async client => {
    const myDataBase = await client.db('bugTracker').collection('users');
    console.log('Dabase connnection called');

    // Save user's id (mongodb) to session (req.session.passport)
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Get user full profile from DB and attach it to the requests as res.user
    passport.deserializeUser((id, done) => {
        myDataBase.findOne({_id: new ObjectId(id)}, (err, doc) => {
            done(null, doc);
        });
    });

    // Set the user authentication Strategy
    passport.use(new LocalStrategy((username, password, done) => {
        myDataBase.findOne({username: username}, (err, user) => {
            console.log(`User ${username} attempted to log in.`);
            if (err) return done(err);
            if (!user) return done(null, false);
            if (!bcrypt.compareSync(password, user.password)) return done(null, false);
            return done(null, user);
        });
    }));

    function ensureAuthenticated(req, res, next) {
        if (req. isAuthenticated()) {
            return next();
        }
        res.redirect('/')
    };

    // Index page (static HTML)
    app.route('/')
        .get(function (req, res) {
            res.sendFile(process.cwd() + '/views/index.html')
        });

    // Log in page
    app.route('/login')
        .get(function (req, res) {
            res.sendFile(process.cwd() + '/views/login.html')
        });

    // Sign up page
    app.route('/signup')
        .get(function (req, res) {
            res.sendFile(process.cwd() + '/views/signup.html')
        });
    
    // Profile page
    app.route('/profile')
        .get(ensureAuthenticated, function (req, res) {
            res.sendFile(process.cwd() + '/views/profile.html')
        });
    
    // Log out
    app.route('/account/logout')
        .get((req, res) => {
            req.logout((err) => {
                if (err) {return next(err);}
                res.redirect('/');
            });
            
        });

    // Log in if account is authenticated
    app.route('/account/login').post(passport.authenticate('local', {failureRedirect: '/'}), 
        (req, res) => {
            res.redirect('/profile')
        }
    );

    // Register new user
    app.route('/account/register')
        .post((req, res, next) => {
            myDataBase.findOne({username: req.body.username}, (err, user) => {
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/');
                } else {
                    const hash = bcrypt.hashSync(req.body.password, 12);
                    myDataBase.insertOne({
                        username: req.body.username,
                        password: hash
                    }, 
                       async (err, doc) => {
                            if (err) {
                                res.redirect('/');
                            } else {                                
                                const options = {
                                    projection: {_id: 0}
                                };
                                const query = await myDataBase.findOne({_id: doc.insertedId}, options);                                
                                next(null, query);
                            }
                        })                    
                }
            })
        }, passport.authenticate('local', {failureRedirect: '/'}),
            (req, res, next) => {
                res.redirect('/profile');
            }
        );

    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });
}).catch(e => {
    app.route('/').get((req, res) => {
        res.render('Unable to connect to the Database')
    })
})


    
const listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port)
});