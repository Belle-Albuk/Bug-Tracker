const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;

module.exports = function(app, myDataBase) {
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
}