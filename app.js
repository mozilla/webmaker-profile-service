// INCLUDES -------------------------------------------------------------------

var restify = require('restify');
var fs = require('fs');
var _ = require('lodash');
var Static = require('node-static');

// SETUP ----------------------------------------------------------------------

// TODO - use actual data
var userData = fs.readFileSync('db/reanimator.json', {
  encoding: 'utf8'
});

userData = JSON.parse(userData);

var server = restify.createServer({
  name: 'webmaker-profile-service',
  version: '0.1.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
server.use(restify.fullResponse());

var isWriting = false;

// ROUTES ---------------------------------------------------------------------

// User Data

// TODO - get specific key values if specified by param

server.get('/user-data/:username', function (req, res, next) {
  res.send(userData);
  console.log(req.route.method, req.url);
  return next();
});

server.get('/user-data/:username/:key', function (req, res, next) {
  if (_.isString(req.params.key)) {
    if (userData[req.params.key]) {
      res.send(userData[req.params.key]);
    } else {
      res.send(404);
    }
  }

  console.log(req.route.method, req.url);
  return next();
});

server.post('/user-data/:username', function (req, res, next) {
  var waitForWrite;

  // TODO - ensure authentication and store in real DB
  console.log(new Date());
  console.log(req.route.method, req.url);

  // Overwrite existing keys with new data
  _.assign(userData, req.params);

  function writeToJSON() {
    isWriting = true;

    fs.writeFile(
      './db/' + req.params.username + '.json',
      JSON.stringify(userData, null, 2), // 2 space indent

      function () {
        console.log('Wrote to ' + req.params.username + '.json');
        isWriting = false;
      });
  }

  // TODO - This is super hacky, but so is using a text file as a database
  if (!isWriting) {
    writeToJSON();
  } else {
    console.log('Write still in progress. Delaying...');

    waitForWrite = setInterval(function () {
      if (!isWriting) {
        writeToJSON();
        clearInterval(waitForWrite);
      } else {
        console.log('Waiting another 100ms');
      }
    }, 100);
  }

  res.send(201);
  return next();
});

// Store Image
// TODO : Store imgs on S3

server.post('/store-img', function (req, res, next) {
  console.log(req.route.method, req.url, req.contentType());

  var imgPath = 'gifs/' + Date.now() + '.gif';
  var base64Data = req.params.image.replace(/^data:image\/gif;base64,/, '');

  require('fs').writeFile(imgPath, base64Data, 'base64');

  res.send(201, {
    imageURL: /*server.url*/ 'http://wmp-service.herokuapp.com' + '/' + imgPath
  });

  return next();
});

// Serve Static Content (TEMP - Remove once imgs are stored on S3)

var file = new Static.Server('./');

server.get(/^\/gifs\/.*/, function (req, res, next) {
  file.serve(req, res, next);
});

// START ----------------------------------------------------------------------

server.listen(process.env.PORT || 8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});
