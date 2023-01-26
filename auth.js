const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const ObjectId = require('mongodb').ObjectId;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function(userDatabase) {
    // Save user's id (mongodb) to session (req.session.passport)
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    // Get user full profile from DB and attach it to the requests as res.user
    passport.deserializeUser((id, done) => {
        userDatabase.findOne({_id: new ObjectId(id)}, (err, doc) => {
            done(null, doc);
        });
    });

    // Set the local user authentication Strategy
    passport.use(new LocalStrategy((username, password, done) => {
        userDatabase.findOne({username: username}, (err, user) => {
            console.log(`User ${username} attempted to log in.`);
            if (err) return done(err);
            if (!user) return done(null, false);
            if (!bcrypt.compareSync(password, user.password)) return done(null, false);
            return done(null, user);
        });
    }));

    // Set the google oauth authentication Strategy
    passport.use(new GoogleStrategy({
        clientID: '318479998696-q1q8j6oc3a4mu9m7f6qurard1f73g8n3.apps.googleusercontent.com',
        clientSecret: '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',
        scope: 'https://www.googleapis.com/auth/userinfo.profile',
        callbackURL: 'http://localhost:3000/google/callback'
    },
        function(accessToken, refreshToken, profile, cb) {
            userDatabase.findOne({providerId: profile.id}, async (err, doc) => {
                if (err) return console.log(err);
                if (!doc) {
                    await userDatabase.insertOne({
                        name: profile.displayName || 'Undefined',
                        providerId: profile.id,
                        provider: profile.provider,
                        created_on: new Date()
                    }, async (err, newUser) => {
                        const newId = newUser.insertedId;
                        console.log(newId);
                        await userDatabase.findOne({_id: newId}, (err, newUser) => {
                            return cb(null, newUser);
                        });
                    });
                    
                } else {
                    return cb(null, doc)}
            })
        }
    ));
}