module.exports.createClient = function createClient(url) {
  var fakeXpress = {
    post: function() {}
  }

  var login = require('webmaker-loginapi')(fakeXpress, {
    loginURL: url,
    audience: 'fake'
  });

  return {
    getUser: login.getUser
  }
};
