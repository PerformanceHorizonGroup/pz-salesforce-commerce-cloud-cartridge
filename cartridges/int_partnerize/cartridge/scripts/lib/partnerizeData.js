'use strict';

/**
 * @description function for getting preferences for Partnerize
 *
 *   id                  | Description                       | type of preference|    Result
 *   ------------------------------------------------------------------------------------------------------------
 *   Enable              | Enable Partnerize                 | Boolean           | true/false
 *   application_api_key | Partnerize Application Api Key    | String            |
 *   user_key            | Partnerize User Key               | String            |
 *   brand_id            | Partnerize Brand ID               | String            |
 *   campaign_id         | Partnerize Campaign ID            | String            |
 *   tag_url             | Partnerize Tag URL                | String            |
 *   conversion_root     | Partnerize Conversion Pixel Root  | String            |
 *   -------------------------------------------------------------------------------------------------------------
 *   Example:
 *    var partnerize = require('int_partnerize/cartridge/scripts/lib/partnerize.js');
 *    partnerize('UserKey');
 * ---------------------------------------------------------------------------------------------------------------
 * @param {string} id - ID preferences
 * @returns {*} - value preferences
 */
function getPreference(id) {
    var site = require('dw/system/Site').getCurrent();
    var result = site.getCustomPreferenceValue('partnerize_' + id) !== null ? site.getCustomPreferenceValue('partnerize_' + id) : false;
    return result;
}

/**
 * @description function for setting preferences for Partnerize
 * @param {string} id - ID preferences
 * @param {*} value - value of preference
 */
function setPreference(id, value) {
    var Transaction = require('dw/system/Transaction');
    var site = require('dw/system/Site').getCurrent();
    Transaction.wrap(function () {
        site.setCustomPreferenceValue('partnerize_' + id, value);
    });
}

module.exports = {
    getPreference: getPreference,
    setPreference: setPreference
};
