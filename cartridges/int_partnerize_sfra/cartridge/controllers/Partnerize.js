'use strict';

var server = require('server');

server.get(
    'ConversionTag',
    server.middleware.https,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var pixelHelper = require('*/cartridge/scripts/pixelHelper');

        var orderId = req.querystring.order_id;
        var orderToken = req.querystring.order_token;
        var order = OrderMgr.getOrder(orderId, orderToken);
        var conversionPixel = order ? pixelHelper.getConversionTag(order) : '';

        res.render('conversionPixel', {
            conversionPixel: conversionPixel
        });
        next();
    }
);

module.exports = server.exports();
