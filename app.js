// INCLUDES -------------------------------------------------------------------

var express = require('express'),
    fs = require('fs'),
    Habitat = require('habitat'),
    path = require('path'),
    uid = require('uid2');

// SETUP ----------------------------------------------------------------------

Habitat.load();

var config = new Habitat();
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
  res.header('Access-Control-Allow-Origin', config.get('AUDIENCE'));
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-csrf-token');
  next();
});

require('express-persona')(server, {
  audience: config.get('AUDIENCE'),
  verifyResponse: function(err, req, res, email) {
    if ( err ) {
      return res.json({
        status: "failure",
        reason: err
      });
    }
    req.session.email = email;
    req.session._csrf = uid(24);
    res.json({
      status: "okay",
      data: {
        email: email,
        csrf: req.session._csrf
      }
    });
  },
  logoutResponse: function(err, req, res) {
    delete req.session.email;
    delete req.session._csrf;
    res.json({
      status: "okay"
    });
  }
});

// ROUTES ---------------------------------------------------------------------

// User Data

var fakeUserData = require('./db/reanimator.json');
var db = require('./services/database').createClient(config.get('DATABASE'));
var data = require('./services/data').createClient(config.get('MAKEAPI'));

server.get('/user-data/:username', function fetchDataFromDB(req, res, next) {
  db.find({ where: { userid: req.params.username }}).success(function(results) {
    // No data exists in the DB, lets try generating some data
    if (!results) {
      return next();
    }

    res.json(results.data);
  }).error(next);
}, function fakeData(req, res, next) {
  if (req.params.username === "reanimator") {
    return res.json(fakeUserData);
  }

  next();
}, function generateData(req, res, next) {
  data.generate(req.params.username, function(err, data) {
    if (err) {
      return next(err);
    }

    if (!data) {
      return res.send(404);
    }

    res.json(data);
  });
});

server.post('/user-data/:username', function (req, res, next) {
  db.findOrCreate({ userid: req.params.username }, { data: JSON.stringify(req.body) }).success(function(result, created) {
    if (created) {
      return res.send(201);
    }

    var json = JSON.parse(result.data);
    Object.keys( req.body ).forEach(function(key) {
      json[key] = req.body[key];
    });

    result.data = JSON.stringify(json);
    result.save(['data']).success(function() {
      res.send(204);
    }).error(next);
  }).error(next);
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
