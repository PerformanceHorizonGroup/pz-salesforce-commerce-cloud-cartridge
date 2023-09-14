'use strict';

var StringUtils = require('dw/util/StringUtils');
var logger = require('dw/system/Logger').getLogger('partnerize');

/**
 * Formats standard error message string
 * @param {string} title        - Error title, place or function name
 * @param {string} url          - Url of the service endpoint
 * @param {number} error        - HTTP response code for an HTTPService
 * @param {string} errorMessage - Error Message
 * @returns {string}            - formatted message
 */
function standardErrorMessage(title, url, error, errorMessage) {
    return StringUtils.format('Error: {0},\nUrl: {1},\nErrorCode: {2},\nMessage: {3}',
        title || 'Partnerize Rest Service',
        url,
        error,
        errorMessage
    );
}

/**
 * Parse error message and write it to log
 * @param {string}        title  - Error title, place or function name
 * @param {string}        url    - Url of the service endpoint
 * @param {dw.svc.Result} result - result
 * @returns {null} - Null
 */
function logServiceError(title, url, result) {
    var logMessage = '';
    var partnerizeErrorResponse;

    switch (result.error) {
        case 404:
            try {
                partnerizeErrorResponse = JSON.parse(result.errorMessage);
                logMessage += StringUtils.format('Code: {0}, Message: {1}\n',
                    partnerizeErrorResponse.error.code,
                    partnerizeErrorResponse.error.message
                );

                if (Object.hasOwnProperty.call(partnerizeErrorResponse.error, 'errors')) {
                    partnerizeErrorResponse.error.errors.forEach(function (partnerizeError) {
                        logMessage += StringUtils.format('Type: {0}, Code: {1}, Message: {2}, Property: {3}\n',
                            partnerizeError.type,
                            partnerizeError.code,
                            partnerizeError.message,
                            partnerizeError.property
                        );
                    });
                } else {
                    // Response is in undocumented format. Write it as plain string.
                    logMessage = standardErrorMessage(title, url, result.error, result.errorMessage);
                }
            } catch (parseError) {
                // Response is not a JSON. Write is as plain string.
                logMessage = standardErrorMessage(title, url, result.error, result.errorMessage);
            }
            break;
        default:
            logMessage = standardErrorMessage(title, url, result.error, result.errorMessage);
    }

    logger.error(logMessage);

    return null;
}

/**
 * Call Partnerize service, parse errors and return data or null
 * @param {string}         title   - Name of the action or method to describe the action performed
 * @param {dw.svc.Service} service - Service instance to call
 * @param {Object}         params  - Params to be passed to service.call function
 * @returns {Object}       - Partnerize Response object or `null` in case of errors
*/
function callService(title, service, params) {
    var result;
    var data = null;

    try {
        result = service.setThrowOnError().call(JSON.stringify(params));
    } catch (error) {
        logger.error('HTTP Service request failed.\nMessage:{0}, Url:{1}', error.name, service.getURL());
        return null;
    }

    if (result.ok) {
        data = result.object;
    } else {
        logServiceError(title, service.getURL(), result);
    }

    return data;
}

/**
 * Check if response type is JSON
 * @param {dw.svc.HTTPService} service - Service to obtain client from
 * @returns {boolean}                  - true if `Content-Type` is `application/json`
 */
function isResponseJSON(service) {
    var contentTypeHeader = service.getClient().getResponseHeader('content-type'); // Partnerize returns lowercase header names in 2023

    if (contentTypeHeader === null) {
        contentTypeHeader = service.getClient().getResponseHeader('Content-Type'); // try camel case
    }

    return contentTypeHeader && contentTypeHeader.split(';')[0].toLowerCase() === 'application/json';
}

/**
 * Call Partnerize service, parse errors and return data or null
 * @param {string}             title   - Name of the action or method to describe the action performed
 * @param {dw.svc.HTTPService} service - Service instance to call
 * @param {Object}             params  - Params to be passed to service.call function
 * @returns {?Object}                  - `JSON.parse` result or `null` in case of errors
 */
function callJsonService(title, service, params) {
    var obj = null;
    var result = callService(title, service, params);

    if (result) {
        obj = {
            statusCode: result.statusCode,
            response: null
        };
        if (isResponseJSON(service)) {
            try {
                obj.response = JSON.parse(result.text);
            } catch (parseError) {
                // response is marked as json, but it is not
                logger.error('JSON.parse error. Method: {0}. String:{1}', title, result.text);
            }
        } else {
            logger.warn('Response is not JSON. Method: {0}. Result:{1}', title, result);
        }
    }
    return obj;
}

module.exports = {
    callJsonService: callJsonService
};
