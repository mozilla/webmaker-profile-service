var APIeasy = require('api-easy');
var assert = require('assert');
var _ = require('lodash');

var suite = APIeasy.describe('user-data');

suite.discuss('When using user-data')
  .use('localhost', 8080)
  .get('/user-data/reanimator')
  .expect(200)
  .expect('should get all properties', function (err, res, body) {
    var data = JSON.parse(body);

    assert.ok(data.username);
    assert.ok(data.realName);
    assert.ok(data.avatarSrc);
    assert.ok(data.makes);
  })
  .get('/user-data/reanimator/realName')
  .expect(200)
  .expect('should be able to get real name only', function (err, res, body) {
    var data = JSON.parse(body);

    assert.ok(_.isString(data));
  })
  .get('/user-data/reanimator/avatarSrc')
  .expect(200)
  .expect('should be able to get avatar src only', function (err, res, body) {
    var data = JSON.parse(body);

    assert.ok(_.isString(data));
  })
  .get('/user-data/reanimator/makes')
  .expect(200)
  .expect('should be able to get makes only', function (err, res, body) {
    var data = JSON.parse(body);

    assert.ok(_.isArray(data));
  })
  .get('/user-data/reanimator/realName')
  .expect(200)
  .expect('should be able to get real name only', function (err, res, body) {
    var data = JSON.parse(body);

    assert.ok(_.isString(data));
  })
  .get('/user-data/reanimator/socialSecurityNumber')
  .expect(404)
  .setHeader('Content-Type', 'application/json')
  .post('/user-data/reanimator', {foo: 'bar'})
  .expect(201)
  .export(module);
