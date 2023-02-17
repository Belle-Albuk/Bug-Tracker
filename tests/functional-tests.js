const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = require('assert');
const should = chai.should();
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

    test('homepage should be working', function(done) {
      chai
        .request(server)
        .get('/')
        .end(function (err, res) {
            assert.equal(res.status, 200);
            done();
        })
    });

    test('logging in with invalid user should be redirected to the homepage', function(done) {
        chai
            .request(server)
            .post('/account/login')
            .type('form')
            .send({username: 'InvalidUser', password: 'dontExist'})
            .end(function(err, res) {
                res.should.redirectTo(res.request.url);
                done();
            })
    })

    test('logging in with a valid user should redirect to /profile', function(done) {
        chai
            .request(server)
            .post('/account/login')
            .type('form')
            .send({username: 'userTest', password: '123'})
            .end(function(err, res) {
                res.should.redirectTo(res.request.url + 'profile');
                done();
            })
    })
});