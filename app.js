// INCLUDES -------------------------------------------------------------------

var express = require('express'),
    fs = require('fs'),
    Habitat = require('habitat'),
    helmet = require('helmet'),
    path = require('path'),
    uid = require('uid2');

// SETUP ----------------------------------------------------------------------

Habitat.load();

var config = new Habitat();
var server = express();

var messina,
    logger;

server.disable( 'x-powered-by' );
if (config.get('FORCE_SSL') ) {
  server.use(helmet.hsts());
  server.enable('trust proxy');
}

if (config.get('ENABLE_GELF_LOGS')) {
  messina = require('messina');
  logger = messina('profile-service-' + config.get('NODE_ENV') || 'development')
  logger.init();
  server.use(logger.middleware());
} else {
  server.use(express.logger());
}


server.use(express.compress());
server.use(express.static( path.join(__dirname + '/node_modules/webmaker-profile')));
server.use(express.json());
server.use(express.urlencoded());
// unsafe, remove later
server.use(express.multipart());

server.use(express.cookieParser());
server.use(express.cookieSession({
  key: 'webmaker-profile.sid',
  secret: config.get('SESSION_SECRET'),
  cookie: {
    // 31 days
    maxAge: 31 * 24 * 60 * 60 * 1000,
    secure: config.get('FORCE_SSL')
  },
  proxy: config.get('FORCE_SSL')
}));

server.use(express.csrf());

require('webmaker-loginapi')(server, {
  loginURL: config.get('LOGINAPI'),
  audience: config.get('AUDIENCE')
});

// ROUTES ---------------------------------------------------------------------

// User Data

var fakeUserData = require('./db/reanimator.json');
var db = require('./services/database').createClient(config.get('DATABASE'));
var data = require('./services/data').createClient(config.get('MAKEAPI'));

server.get('/user-data/:username', function fetchDataFromDB(req, res, next) {
  var username = req.params.username;
  db.find({ where: { userid: username }}).success(function(results) {
    // No data exists in the DB, lets try generating some data
    if (!results) {
      return next();
    }

    res.type('application/json; charset=utf-8');
    if ( req.session && req.session.username === username ) {
      try {
        data.hydrate(JSON.parse(results.data), function(err, data) {
          if (err) {
            return next(err);
          }
          res.send(200, JSON.stringify(data));
        });
      } catch(e) {
        console.error('error: ' + JSON.stringify(e));
        res.send(500);
      }
    } else {
      res.send(200, results.data);
    }
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
  if (req.session.username !== req.params.username && req.params.username !== 'reanimator') {
    return res.send(403);
  }

  db.findOrCreate({ userid: req.params.username }, { data: JSON.stringify(req.body) }).success(function(result, created) {
    if (created) {
      return res.send(201);
    }

    try {
      var json = JSON.parse(result.data);
    } catch (ex) {
      return res.send(500);
    }

    Object.keys( req.body ).forEach(function(key) {
      json[key] = req.body[key];
    });

    result.data = JSON.stringify(json);
    result.save(['data']).success(function() {
      res.send(200);
    }).error(next);
  }).error(next);
});

var s3 = require('knox').createClient(config.get('S3'));

server.post('/store-img', function (req, res, next) {
  var base64Data = new Buffer(req.body.image, 'base64');

  var s3req = s3.putBuffer(base64Data, '/gifs/' + uid(24) + '.gif', {
    'Content-Type': 'image/gif',
    'x-amz-acl': 'public-read'
  }, function(err, s3res) {
    if (err) {
      return next(err);
    }

    if (s3res.statusCode !== 200) {
      return next('S3 returned HTTP ' + s3res.statusCode);
    }

    res.json(201, {
      imageURL: s3req.url
    });
  });
});

var _feConfig = JSON.stringify({
  serviceURL: config.get('AUDIENCE'),
  confirmDelete: true
});

server.get('/env.json', function(req, res, next) {
  res.type('application/json; charset=utf-8');
  res.send(200, _feConfig);
});

server.get('/getcsrf', function(req, res, next) {
  res.json({csrfToken: req.session._csrf});
});

var healthcheck = JSON.stringify({
  http: "okay",
  version: require("./package.json").version
});

server.get('/healthcheck', function(req, res) {
  res.type('application/json; charset=utf-8');
  res.send(healthcheck);
});

// START ----------------------------------------------------------------------
require("webmaker-profile").build(function() {
  server.listen(config.get('PORT'), function () {
    console.log('server listening on %s', config.get('AUDIENCE'));
  });
});
