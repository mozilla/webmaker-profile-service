// INCLUDES -------------------------------------------------------------------

var express = require('express'),
    fs = require('fs'),
    Habitat = require('habitat'),
    path = require('path');

// SETUP ----------------------------------------------------------------------

Habitat.load();

var config = new Habitat();

// TODO - use actual data
var userData = fs.readFileSync('db/reanimator.json', {
  encoding: 'utf8'
});

userData = JSON.parse(userData);

var server = express();

server.disable( 'x-powered-by' );
server.use(express.compress());
server.use(express.logger());
server.use(express.json());
server.use(express.urlencoded());
// unsafe, remove later
server.use(express.multipart());

server.use(express.cookieParser());
server.use(express.cookieSession({
  key: 'webmaker-profile.sid',
  secret: 'a',
  cookie: {
    // 31 days
    maxAge: 31 * 24 * 60 * 60 * 1000,
    secure: false
  },
  proxy: true
}));

server.use(express.static( path.join(__dirname + '/public')));

server.use(function cors( req, res, next ) {
  res.header( "Access-Control-Allow-Origin", "*" );
  res.header( "Access-Control-Allow-Headers", "Content-Type" );
  next();
});

server.use( server.router );


var isWriting = false;

// ROUTES ---------------------------------------------------------------------

// User Data

// TODO - get specific key values if specified by param

server.get('/user-data/:username', function (req, res, next) {
  res.json(userData);
  console.log(req.route.method, req.url);
});

server.get('/user-data/:username/:key', function (req, res, next) {
  if (userData[req.params.key]) {
    res.json(userData[req.params.key]);
  } else {
    res.send(404);
  }

  console.log(req.route.method, req.url);
});

server.post('/user-data/:username', function (req, res, next) {
  var waitForWrite;

  // Overwrite existing keys with new data
  Object.keys( req.body ).forEach(function(key) {
    userData[key] = req.body[key];
  });

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
});

// Store Image
// TODO : Store imgs on S3

server.post('/store-img', function (req, res, next) {
  var imgPath = 'public/gifs/' + Date.now() + '.gif';

  var base64Data = req.body.image.replace(/^data:image\/gif;base64,/, '');

  require('fs').writeFile(imgPath, base64Data, 'base64');

  res.json(201, {
    //imageURL: 'http://wmp-service.herokuapp.com' + '/' + imgPath // HEROKU
    imageURL: imgPath.replace('public/', 'http://localhost:8080/') // LOCALHOST
  });
});

// START ----------------------------------------------------------------------
server.listen(config.get('PORT'), function () {
  console.log('server listening on port %s', config.get('PORT'));
});
