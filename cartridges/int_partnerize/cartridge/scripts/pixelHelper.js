'use strict';

var partnerizeData = require('*/cartridge/scripts/lib/partnerizeData');

/**
 * Get first coupon code from Order
 * @param {dw.order.Order} order - order
 * @returns {string} - couppon code
 */
function getFirstCouponCode(order) {
    var couponCode = null;
    if (order) {
        var couponItems = order.getCouponLineItems();
        couponCode = couponItems.size() > 0 ? couponItems[0].couponCode : null;
    }
    return couponCode;
}

/**
 * Get Conversion Tag data string
 * @param {dw.order.Order} order - order
 * @returns {string} - Conversion Tag data string
 */
function getConversionTag(order) {
    var conversionPixel = partnerizeData.getPreference('conversion_root').replace(/\/$/, '');
    conversionPixel += '/campaign:' + partnerizeData.getPreference('campaign_id'); // partnerize_campaign_id
    conversionPixel += '/conversionref:' + order.orderNo; // SFCC Order Number
    conversionPixel += '/customertype:' + (order.customer.anonymous ? 'new' : 'existing');

    var couponCode = getFirstCouponCode(order);
    if (couponCode) {
        conversionPixel += '/voucher:' + couponCode; // Coupon Code (if multiple, use first one returned)
    }

    conversionPixel += '/currency:' + order.currencyCode;  // Site Currency
    if (order.customerLocaleID) {
        var currentLocale = order.customerLocaleID;
        if (currentLocale.length > 2) {
            var pos = currentLocale.indexOf('_');
            currentLocale = currentLocale.slice(pos + 1);
        }
        conversionPixel += '/country:' + currentLocale.toUpperCase(); // Site Country
    }

    // Product item detail
    conversionPixel += '/';
    var productLineItems = order.getProductLineItems();

    productLineItems.toArray().forEach(function (pli) {
        conversionPixel += '[';

        var category = null; // Primary Category of Product
        if (pli.product.primaryCategory) {
            category = pli.product.primaryCategory;
        } else if (Object.hasOwnProperty.call(pli.product, 'masterProduct')) {
            category = pli.product.masterProduct.primaryCategory;
        }

        if (category) {
            conversionPixel += 'category:' + category.displayName + '/';
        }

        conversionPixel += 'sku:' + pli.productID; // ProductID

        var priceItem = pli.proratedPrice.divide(pli.quantity.value);
        conversionPixel += '/value:' + priceItem.value; // Price per item
        conversionPixel += '/quantity:' + pli.quantity.value; // Lineitem Quantity

        // Add variant attributes
        if (pli.product.variant && pli.product.variationModel) {
            var variantAttributes = pli.product.variationModel.getProductVariationAttributes();
            variantAttributes.toArray().forEach(function (variantAttr) {
                var attrId = variantAttr.attributeID;
                conversionPixel += '/' + attrId + ':' + pli.product.custom[attrId]; // Variant attribute
            });
        }
        conversionPixel += ']';
    });

    return conversionPixel;
}

module.exports = {
    getConversionTag: getConversionTag
};
