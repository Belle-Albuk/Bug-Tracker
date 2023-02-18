const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const should = chai.should();
const server = require('../server');

chai.use(chaiHttp);
const agent = chai.request.agent(server);
let issueId;

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
        agent
            .post('/account/login')
            .type('form')
            .send({username: 'userTest', password: '123'})
            .then(async function(res) {
                await agent.get('/profile/api')
                            .then(function(res) {
                                assert.isArray(res.body, 'res.body should be an array');
                                
                            }).catch((err) => console.log(err))
            }).catch((err) => console.log(err))
    });

    test('POST method on /profile/api should return an object that contains the data that was sent', function() {
        agent
            .post('/account/login')
            .type('form')
            .send({username: 'userTest', password: '123'})
            .then(async function(res) {
                await agent.post('/profile/api')
                            .send({
                                title: 'testing-Title',
                                description: 'testing text',
                                assigned_to: 'testingUser',
                                priority: 'low'})
                            .then(function(res) {
                                issueId = res.body._id;
                                assert.include(res.body, {
                                created_by: 'userTest',
                                bug_title: 'testing-Title',
                                bug_description: 'testing text',
                                assigned_to: 'testingUser',
                                priority: 'low',
                                open: true}, 'res.body contains the sent properties + open is true');
                                agent.close();                                
                            }).catch((err) => console.log(err))
            }).catch((err) => console.log(err))
    })
});