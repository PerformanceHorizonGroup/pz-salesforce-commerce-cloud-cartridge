'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var pixelHelper = proxyquire('../../../../cartridges/int_partnerize/cartridge/scripts/pixelHelper', {
    '*/cartridge/scripts/lib/partnerizeData': {
        getPreference: function () { return 'test_pref'; }
    }
});

describe('Helper - partnerize pixel URL', function () {
    it('should return partnerize pixel URL string', function () {
        var order = {
            orderNo: '00001',
            customer: {
                anonymous: true
            },
            currencyCode: 'USD',
            customerLocaleID: 'en_US',

            getCouponLineItems: function () {
                var items = [{
                    couponCode: '1234567890'
                }];
                items.size = function () {
                    return items.length;
                };
                return items;
            },

            getProductLineItems: function () {
                return {
                    toArray: function () {
                        return [{
                            productID: 'M4561845',
                            adjustedPrice: {
                                value: 45.21
                            },
                            proratedPrice: {
                                value: 45.21 * 2,
                                divide: function (quantity) {
                                    return {
                                        value: this.value / quantity
                                    };
                                }
                            },
                            quantity: {
                                value: 2
                            },
                            product: {
                                primaryCategory: {
                                    displayName: 'testCategory'
                                },
                                custom: {
                                    size: '25'
                                },
                                variant: true,
                                variationModel: {
                                    getProductVariationAttributes: function () {
                                        return {
                                            toArray: function () {
                                                return [{
                                                    attributeID: 'size'
                                                }];
                                            }
                                        };
                                    }
                                }
                            }
                        }];
                    }
                };
            }
        };

        var pixel = pixelHelper.getConversionTag(order);
        var result = 'test_pref/campaign:test_pref/conversionref:00001/customertype:new/voucher:1234567890/currency:USD/country:US/[category:testCategory/sku:M4561845/value:45.21/quantity:2/size:25]';

        assert.equal(pixel, result);
    });
});
