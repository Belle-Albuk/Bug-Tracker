const express = require('express');
const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

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
    
const listener = app.listen(3000, function () {
    console.log('Your app is listening on port ' + listener.address().port)
});