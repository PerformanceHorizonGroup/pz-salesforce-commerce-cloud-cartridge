'use strict';

var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var CSRFProtection = require('dw/web/CSRFProtection');
var Resource = require('dw/web/Resource');
var partnerizeData = require('*/cartridge/scripts/lib/partnerizeData');

/**
 * @description render dashboard
 */
function Start() {
    var viewData = {
        configurationContinueUrl: URLUtils.https('PartnerizeConfig-HandleForm'),
        tagUrl: partnerizeData.getPreference('tag_url'),
        error: false,
        init: true
    };
    ISML.renderTemplate('index', viewData);
}

/**
 * @description Form Handle
 */
function handleForm() {
    if (CSRFProtection.validateRequest()) {
        var instance = require('*/cartridge/scripts/lib/constants').instance;
        var serviceHelper = require('*/cartridge/scripts/service/serviceHelper');
        var partnerizeService = require('*/cartridge/scripts/service/partnerizeInit');
        var service = partnerizeService.init();

        var params = request.httpParameterMap.getParameterMap('custom_');
        var payload = null;
        var serviceResponse = null;
        var viewData = {
            configurationContinueUrl: URLUtils.https('PartnerizeConfig-HandleForm'),
            tagUrl: partnerizeData.getPreference('tag_url'),
            error: false,
            init: false
        };

        if (params.submit.value === 'create') {
            service.setRequestMethod('POST');
            service.setURL(instance + '/brand/partnerize-tags');
            var currentSite = Site.getCurrent();
            payload = {
                name: 'partnerize_' + currentSite.getID(),
                scope: {
                    brand: partnerizeData.getPreference('brand_id')
                }
            };

            // Create Partnerize tag
            serviceResponse = serviceHelper.callJsonService('createTag', service, payload);

            if (!empty(serviceResponse) && serviceResponse.statusCode === 201) {
                var tagUrl = serviceResponse.response.data.url;
                var tagId = serviceResponse.response.data.id;
                partnerizeData.setPreference('tag_url', tagUrl);
                viewData.tagUrl = tagUrl;

                service.setRequestMethod('POST');
                service.setURL(instance + '/brand/partnerize-tags/' + tagId + '/features');
                payload = {
                    name: 'first-party-tracking'
                };

                // Enable Feature on Partnerize Tag
                serviceResponse = serviceHelper.callJsonService('enableFeatureOnTag', service, payload);

                if (!empty(serviceResponse) && serviceResponse.statusCode === 201) {
                    viewData.error = false;
                    viewData.message = Resource.msg('service.createtag.ok', 'partnerize', null);
                } else {
                    viewData.error = true;
                    viewData.message = Resource.msg('service.enable.error', 'partnerize', null);
                }
            } else {
                viewData.error = true;
                viewData.message = Resource.msg('service.createtag.error', 'partnerize', null);
            }
        } else {
            response.redirect(URLUtils.https('PartnerizeConfig-Start'));
        }
        ISML.renderTemplate('index', viewData);
    } else {
        ISML.renderTemplate('errorCSRF');
    }
}

exports.Start = Start;
exports.Start.public = true;

exports.HandleForm = handleForm;
exports.HandleForm.public = true;
