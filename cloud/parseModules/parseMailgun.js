var _apiUrl = 'api.mailgun.net/v3';
var _domainName = '';
var _apiKey = '';

module.exports = {
    initialize: function(domainName, apiKey) {
        _domainName = domainName;
        _apiKey = apiKey;
        return this;
    },
    sendEmail: function (params, options) {
        var promise;
        if (Parse.Promise) {
            promise = new Parse.Promise();
        } else {
            promise = {
                resolve: function() {},
                reject: function() {}
            };
        }

        Parse.Cloud.httpRequest({
            method: "POST",
            url: "https://api:" + _apiKey + "@" + _apiUrl + "/" + _domainName + "/messages",
            body: jsonArrayToUrl(params),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            success: function(httpResponse) {
                if (options && options.success) {
                    options.success(httpResponse);
                }
                promise.resolve(httpResponse);
            },
            error: function(httpResponse) {
                if (options && options.error) {
                    options.error(httpResponse);
                }
                promise.reject(httpResponse);
            }
        });

        return promise;

        function jsonArrayToUrl(obj) { var arrParams = []; for (var key in obj) { arrParams.push(key + "=" + encodeURIComponent(obj[key])); } return arrParams.join("&"); }
    }
};

