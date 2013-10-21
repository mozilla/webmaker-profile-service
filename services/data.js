var MakeAPI = require("makeapi-client");
var defaultAvatar = "https://stuff.webmaker.org/avatars/webmaker-avatar-200x200.png";

module.exports.createClient = function createClient(url) {
  var makeapi = new MakeAPI({
    apiURL: url
  });

  var profileMakeAttrs = [
    "url",
    "contentType",
    "locale",
    "title",
    "description",
    "author",
    "published",
    "tags",
    "thumbnail",
    "username",
    "remixedFrom",
    "emailHash",
    "createdAt",
    "updatedAt",
    "likes",
    "id"
  ];

  return {
    generate: function(user, callback) {
      makeapi
      .user(user)
      .limit(1000)
      .sortByField('updatedAt', 'desc')
      .then(function(err, makes, total) {
        if (err) {
          return callback(err);
        }

        callback(null, {
          "username": user,
          "realName": user,
          "avatarSrc": makes.length ? "https://secure.gravatar.com/avatar/" + makes[0].emailHash + "?s=200&d=" + encodeURIComponent(defaultAvatar) : defaultAvatar,
          "makes": makes.map(function(make) {
            return {
              "url": make.url,
              "contentType": make.contentType,
              "locale": make.locale,
              "title": make.title,
              "description": make.description,
              "author": make.author,
              "published": make.published,
              "tags": make.tags,
              "thumbnail": make.thumbnail,
              "username": make.username,
              "remixedFrom": make.remixedFrom,
              "emailHash": make.emailHash,
              "createdAt": make.createdAt,
              "updatedAt": make.updatedAt,
              "likes": make.likes,
              "id": make.id,
              "type": make.contentType.substring(14)
            };
          }),
          "tileOrder": makes.map(function(make) {
            return make.id;
          })
        });
      });
    },
    hydrate: function(data, callback) {
      var profileIdHash = {},
          newMakeIdHash = {};

      // store make data from the current profile as an object, keyed by ID
      data.makes.forEach(function(make) {
        profileIdHash[make.id] = make;
      });

      // get up to 1000 of the user's most recent makes
      makeapi
      .user(data.username)
      .limit(1000)
      .sortByField('updatedAt', 'desc')
      .then(function(err, makes, total) {
        if (err) {
          return callback(err);
        }

        // store the make data from the request as an object, keyed by ID
        makes.forEach(function(make) {
          newMakeIdHash[make.id] = make;
        });

        // if an id in the profile does not exist in the search hits, remove it from the profile
        Object.keys(profileIdHash).forEach(function(id) {
          if ( profileIdHash.type !== 'hackable' && !newMakeIdHash[id] ) {
            delete profileIdHash[id];
          }
        });

        // update profile make data using search results, and add new makes to the profile automatically
        makes.forEach(function(make) {
          var id = make.id;
          if (profileIdHash[id]) {
            profileMakeAttrs.forEach(function(key) {
              if (make[key] !== profileIdHash[id][key]) {
                profileIdHash[id][key] = make[key];
              }
            });
          } else {
            profileIdHash[id] = make;
            profileIdHash[id].type = make.contentType.substring(14)
            data.tileOrder.push(id);
          }
        });

        // generate the new profile data
        data.makes = Object.keys(profileIdHash).map(function(id) {
          return profileIdHash[id];
        });

        callback(null, data);
      });
    }
  }
};
