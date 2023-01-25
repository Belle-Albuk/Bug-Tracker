const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = function(app, myDataBase) {
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

}