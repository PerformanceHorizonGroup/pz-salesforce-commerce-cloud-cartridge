'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');

// Globally scoped variables
var orderIterator;

/**
 * Function is executed only ONCE
 */
function beforeStep() {
    orderIterator = OrderMgr.searchOrders('( status = {0} OR status = {1} ) AND custom.partnerize_synced = {2}', null,
        Order.ORDER_STATUS_COMPLETED, Order.ORDER_STATUS_CANCELLED, false);
}

/**
 * The read function returns either one item or nothing.
 * It returns nothing if there are no more items available
 * @returns {dw.order.Order} - Order for update
 */
function read() {
    var currentOrder = null;
    if (orderIterator.hasNext()) {
        currentOrder = orderIterator.next();
    }
    return currentOrder;
}

/**
 * It receives the item returned by the read function, performs a process, and returns one item
 * @param {dw.order.Order} currentOrder - Order for processing
 * @returns {Object} - order number and order status
 */
function process(currentOrder) {
    var orderModelToUpdate = null;
    if (currentOrder) {
        orderModelToUpdate = {
            orderNo: currentOrder.orderNo,
            order: currentOrder
        };
        if (currentOrder.status.value === Order.ORDER_STATUS_COMPLETED) {
            orderModelToUpdate.status = 'approved';
        } else {
            orderModelToUpdate.status = 'rejected';
        }
    }
    return orderModelToUpdate;
}

/**
 * The write function receives a list of items.
 * The list size matches the chunk size or smaller, if the number of items in the last available chunk is smaller.
 * @param {dw.util.List} orderModelToUpdateList - list of orderModelToUpdate
 * @returns {Status} - status
 */
function write(orderModelToUpdateList) {
    var Transaction = require('dw/system/Transaction');
    var instance = require('*/cartridge/scripts/lib/constants').instance;
    var partnerizeService = require('*/cartridge/scripts/service/partnerizeInit');
    var serviceHelper = require('*/cartridge/scripts/service/serviceHelper');
    var partnerizeData = require('*/cartridge/scripts/lib/partnerizeData');

    var param = {
        conversion_references: {}
    };
    var numberOfOrders = orderModelToUpdateList.size();
    var item = null;

    for (var i = 0; i < numberOfOrders; i++) {
        item = orderModelToUpdateList.get(i);
        param.conversion_references[item.orderNo] = {
            status: item.status
        };
    }

    var service = partnerizeService.init();
    service.setRequestMethod('POST');
    var campaignId = partnerizeData.getPreference('campaign_id');
    service.setURL(instance + '/brand/campaigns/' + campaignId + '/conversions/bulk');

    var serviceResult = serviceHelper.callJsonService('conversionsBulk', service, param);

    try {
        if (serviceResult && serviceResult.statusCode === 202) {
            Transaction.wrap(function () {
                for (var k = 0; k < numberOfOrders; k++) {
                    item = orderModelToUpdateList.get(k);
                    item.order.custom.partnerize_synced = true;
                }
            });
        } else {
            Logger.error('Unable to send order status to Partnerize');
            return new Status(Status.ERROR);
        }
    } catch (e) {
        Logger.error('Unable to update order status. Step has failed with the following error: ' + e.message);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
}

/**
 * Function is executed only ONCE
 */
function afterStep() {
    // close product seekable iterators
    orderIterator.close();
}

module.exports = {
    beforeStep: beforeStep,
    read: read,
    process: process,
    write: write,
    afterStep: afterStep
};
