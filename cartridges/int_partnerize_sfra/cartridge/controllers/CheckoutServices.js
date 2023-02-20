'use strict';

var page = module.superModule;
var server = require('server');
server.extend(page);

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var viewData = res.getViewData();

    if (viewData.error) {
        res.setViewData(viewData);
        return next();
    }

    var order = OrderMgr.getOrder(viewData.orderID, viewData.orderToken);
    if (order) {
        Transaction.wrap(function () {
            order.custom.partnerize_synced = false;
        });
    }

    res.setViewData(viewData);
    return next();
});

module.exports = server.exports();
