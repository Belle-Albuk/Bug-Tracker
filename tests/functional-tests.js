const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
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

    test('logging in with invalid user should redirect to the homepage', function(done) {
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

    test('GET method on /profile/api should return an array', function() {
        const agent = chai.request.agent(server);
        agent
            .post('/account/login')
            .type('form')
            .send({username: 'userTest', password: '123'})
            .then(async function(res) {
                await agent.get('/profile/api')
                            .then(function(res) {
                                assert.isArray(res.body, 'res.body should be an array');
                                agent.close();
                            }).catch((err) => console.log(err))
            }).catch((err) => console.log(err))
    });
});