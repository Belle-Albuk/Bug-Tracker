const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, userDatabase) {
    // Log in if account is authenticated
        app.route('/account/login').post(passport.authenticate('local', {failureRedirect: '/'}), 
        (req, res) => {
            req.session.user_id = req.user._id;
            req.session.username = req.user.username;
            res.redirect('/profile')
        }
    );

    // Register new user
    app.route('/account/register')
        .post((req, res, next) => {
            userDatabase.findOne({username: req.body.username}, (err, user) => {
                if (err) {
                    next(err);
                } else if (user) {
                    res.status(400).send({error: 'Username already taken'});
                } else {                    
                    const hash = bcrypt.hashSync(req.body.password, 12);
                    userDatabase.insertOne({
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
                                const query = await userDatabase.findOne({_id: doc.insertedId}, options);                                
                                next(null, query);
                            }
                        })                    
                }
            })
        }, passport.authenticate('local', {failureRedirect: '/'}),
            (req, res, next) => {
                req.session.user_id = req.user._id;
                req.session.username = req.user.username;
                res.redirect('/profile');
            }
        );

    // Sign up/Log in with a Google account
    app.get('/auth/google',
        passport.authenticate('google', {scope: ['profile']})
    );

    app.get('/google/callback',
        passport.authenticate('google', {failureRedirect: '/'}),
        function(req, res) {
            // Successful authentication
            req.session.user_id = req.user._id;
            req.session.username = req.user.name;
            res.redirect('/profile');
        }
    );

}