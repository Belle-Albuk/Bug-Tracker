require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const myDB = require('./connection');

const auth = require('./auth');
const routes = require('./routes');

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

    auth(app, myDataBase);
    routes(app, myDataBase);

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