'use strict';

var app = require('*/cartridge/scripts/app');
var guard = require('*/cartridge/scripts/guard');

/**
 * Render Conversion Pixel Tag
 */
function conversionTag() {
    var OrderMgr = require('dw/order/OrderMgr');
    var pixelHelper = require('*/cartridge/scripts/pixelHelper');

    var orderId = request.httpParameterMap.order_id.stringValue;
    var orderToken = request.httpParameterMap.order_token.stringValue;
    var order = OrderMgr.getOrder(orderId, orderToken);
    var conversionPixel = order ? pixelHelper.getConversionTag(order) : '';

    app.getView({
        conversionPixel: conversionPixel
    }).render('conversionPixel');
}

exports.ConversionTag = guard.ensure(['get', 'https'], conversionTag);
