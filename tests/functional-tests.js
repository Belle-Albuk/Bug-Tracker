const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const should = chai.should();
const server = require('../server');

chai.use(chaiHttp);
const agent = chai.request.agent(server);
let issueId;

suite('Functional Tests', function () {

    test('homepage should be working', function (done) {
        chai
            .request(server)
            .get('/')
            .end(function (err, res) {
                assert.equal(res.status, 200);
                done();
            })
    });

    test('logging in with invalid user should redirect to the homepage', function (done) {
        chai
            .request(server)
            .post('/account/login')
            .type('form')
            .send({ username: 'InvalidUser', password: 'dontExist' })
            .end(function (err, res) {
                res.should.redirectTo(res.request.url);
                done();
            })
    })

    test('logging in with a valid user should redirect to /profile', function (done) {
        chai
            .request(server)
            .post('/account/login')
            .type('form')
            .send({ username: 'userTest', password: '123' })
            .end(function (err, res) {
                res.should.redirectTo(res.request.url + 'profile');
                done();
            })
    })

    test('testing GET and POST method for /profile/api, PUT and DELETE method for /profile/api/:id', function () {
        agent
            .post('/account/login')
            .type('form')
            .send({ username: 'userTest', password: '123' })
            .then(async function (res) {

                await agent.get('/profile/api')
                    .then(function (res) {
                        assert.isArray(res.body, 'res.body should be an array');

                    }).catch((err) => console.log(err))

            })
            .then(async function (res) {

                await agent.post('/profile/api')
                    .send({
                        title: 'testing-Title',
                        description: 'testing text',
                        assigned_to: 'testingUser',
                        priority: 'low'
                    })
                    .then(function (res) {
                        issueId = res.body._id;
                        console.log('id_: ', issueId);
                        assert.include(res.body, {
                            created_by: 'userTest',
                            bug_title: 'testing-Title',
                            bug_description: 'testing text',
                            assigned_to: 'testingUser',
                            priority: 'low',
                            open: true
                        }, 'res.body contains the sent properties + open is true');
                    }).catch((err) => console.log(err))

            })
            .then(async function (res) {
                await agent.put('/profile/api/' + issueId)
                    .send({
                        title: 'updated title',
                        description: 'updated description',
                        assigned_to: 'updated user',
                        priority: 'urgent',
                        close: true
                    })
                    .then(function (res) {
                        assert.equal(res.body.result, 'successfully updated');
                        assert.equal(res.body._id, issueId);
                    }).catch((err) => console.log(err))
            })
            .then(async function (res) {
                await agent.delete('/profile/api/' + issueId)
                    .then(function (res) {
                        assert.equal(res.body.result, 'successfully deleted');
                        assert.equal(res.body._id, issueId);
                        agent.close();
                    }).catch((err) => console.log(err))
            })
            .catch((err) => console.log(err))
    })
});