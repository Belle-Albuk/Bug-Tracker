require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const ObjectId = require('mongodb').ObjectId;
const myDB = require('./connection');

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
    })

    // Get user full profile from DB and attach it to the requests as res.user
    passport.deserializeUser((id, done) => {
        myDataBase.findOne({_id: new ObjectId(id)}, (err, doc) => {
            done(null, doc);
        });
    })

    // Index page (static HTML)
    app.route('/')
        .get(function (req, res) {
            res.sendFile(process.cwd() + '/views/index.html')
        });

    // Log in page
    app.route('/login')
        .get(function (req, res) {
            res.sendFile(process.cwd() + '/views/login.html')
        })

    // Sign up page
    app.route('/signup')
        .get(function (req, res) {
            res.sendFile(process.cwd() + '/views/signup.html')
        })
}).catch(e => {
    app.route('/').get((req, res) => {
        res.render('Unable to connect to the Database')
    })
})


    
const listener = app.listen(process.env.PORT || 3000, function () {
    console.log('Your app is listening on port ' + listener.address().port)
});