var conf = require('./config');
var fs = require('fs');
var request = require('request');
var _ = require('underscore');

module.exports = {
  init: function(keepDb) {
    var j = request.jar();
    var r = request.defaults({ jar: j, followRedirect: false });
    return r;
  },

  login: function (request, user, cb) {
    // handle variable length arguments
    if (_.isFunction(user)) {
      cb = user;
      user = conf.defaultUser;
    }
    // logout first
    request.get({ url: conf.url + '/auth/logout' }, function (err, response, body) {
      if (err) { return cb(err); }
      // then login
      request.post({ url: conf.url + '/auth/local',
                     form: { username: user.username, password: user.password, json: true },
                   }, function (err, response, body) {
        var getUser = function (cb) {
          request(conf.url + '/user', function (err, response, body) {
            if (err) { return cb(err); }
            if (response.statusCode !== 200) {
              return cb('Error: Login unsuccessful. ' + body)
            }
            var b = JSON.parse(body);
            user.obj = b;
            return cb(null);
          });
        }
        if (response.statusCode == 403) {
          // this could be because the user isn't registered; try to register
          request.post({ url: conf.url + '/auth/register',
                         form: { username: user.username, password: user.password, json: true },
                       }, function (err, response, body) {
            if (err) { return cb(err); }
            return getUser(cb);
          });
        } else {
          return getUser(cb);
        }
      });
    });
  },

  createProject: function(request, open, cb) {
    if (!open) {
      conf.project.state = 'draft';
    } else {
      conf.project.state = 'open';
    }
    request.post({ url: conf.url + '/project',
                   body: JSON.stringify(conf.project)
                 }, function(err, response, body) {
      if (err) { return cb(err, null); }
      var b = JSON.parse(body);
      cb(null, b);
    });
  }

};