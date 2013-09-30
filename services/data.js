var MakeAPI = require("makeapi-client");
var defaultAvatar = "https://stuff.webmaker.org/avatars/webmaker-avatar-200x200.png";

module.exports.createClient = function createClient(url) {
  var makeapi = new MakeAPI({
    apiURL: url
  });

  return {
    generate: function(user, callback) {
      makeapi
      .user(user)
      .limit(1000)
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
    }
  }
};
