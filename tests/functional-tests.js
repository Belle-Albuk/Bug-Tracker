const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = require('assert');
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

    test('The status should be 200', function (done) {
      chai
        .request(server)
        .get('/')
        .end(function (err, res) {
            assert.equal(res.status, 200);
            done();
        })
    });
});