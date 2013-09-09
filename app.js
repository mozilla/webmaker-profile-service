var restify = require('restify');
var fs = require('fs');

var server = restify.createServer({
  name: 'webmaker-profile-service',
  version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.get('/user-data/:username', function (req, res, next) {
  var userData = fs.readFileSync('fake.json', {
    encoding: 'utf8'
  });

  userData = JSON.parse(userData);

  res.send(userData);
  return next();
});

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});
