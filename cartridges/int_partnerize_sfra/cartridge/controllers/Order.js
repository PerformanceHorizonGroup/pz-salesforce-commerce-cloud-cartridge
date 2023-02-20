'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

server.append('Confirm', function (req, res, next) {
    var orderToken = req.form.orderToken || req.querystring.token;

    res.setViewData({
        orderToken: orderToken
    });
    return next();
});

module.exports = server.exports();
