'use strict';

/**
 * Initialize services for the Partnerize cartridge
 */

/**
 * @description initialize services for the Partnerize cartridge
 * @returns {dw.svc.HTTPService} - setvise object
 */
function init() {
    var initService = require('dw/svc/LocalServiceRegistry').createService('partnerize.http', {
        createRequest: function (svc, args) {
            var StringUtils = require('dw/util/StringUtils');
            var partnerizeData = require('*/cartridge/scripts/lib/partnerizeData');
            var auth = partnerizeData.getPreference('application_api_key') + ':' + partnerizeData.getPreference('user_key');
            auth = 'Basic ' + StringUtils.encodeBase64(auth);
            svc.addHeader('Authorization', auth);
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Accept', 'application/json');
            return args;
        },

        parseResponse: function (svc, client) {
            return client;
        },

        filterLogMessage: function (data) {
            return data;
        }
    });
    return initService;
}

module.exports.init = init;
