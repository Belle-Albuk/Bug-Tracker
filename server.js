require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');

const myDB = require('./connection');
const auth = require('./auth');
const routes = require('./routes/routes');
const api = require('./routes/api');

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const store = MongoStore.create({mongoUrl: process.env.MONGO_URI})

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {secure: false},
    store: store
}))

app.use(passport.initialize());
app.use(passport.session());

myDB(async client => {
    const userDatabase = await client.db('bugTracker-session-authentication').collection('users');
    const bugDatabase = await client.db('bugTracker-session-authentication').collection('bug');
    console.log('Database connnection called');

    auth(userDatabase);
    routes(app, userDatabase);
    api(app, userDatabase, bugDatabase);

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