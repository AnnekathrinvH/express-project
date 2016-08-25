var https = require('https');
var myToken;
var parsedResponse;

var credentials = require('./credentials.json');

module.exports.twitterTokenRequest = function() {
    var consumerKey = credentials.consumerKey;
    var consumerSecret = credentials.consumerSecret;
    var myString = consumerKey + ':' + consumerSecret;
    var myKey = Buffer(myString).toString('base64');

    var options = {
        hostname: 'api.twitter.com',
        path: '/oauth2/token',
        method: 'POST',
        headers: {
            Authorization: 'Basic '+ myKey,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        port: 443
    };
    var req = https.request(options, function(res) {

        var str = '';
        res.on('data', function (chunk) {
            str += chunk;
        });

        res.on('end', function () {
            var response = str;

            try {
                response = JSON.parse(response);
                myToken = response.access_token;

            } catch(e) {
            console.log(e);
            return;
            }
        });
    });
    req.write('grant_type=client_credentials');
    req.end();
};

module.exports.twitterDataRequest = function(logData) {
    console.log('datarequest');
    var response;
    var options = {
        hostname: 'api.twitter.com',
        path: '/1.1/statuses/user_timeline.json?screen_name=theonion',
        method: 'GET',
        headers: {
            Authorization: 'Bearer '+ myToken,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        port: 443
    };

    var req = https.request(options, function(res) {
        var str = '';
        var titlesArray = [];
        var dataObject = [];
        res.on('data', function (chunk) {
            str += chunk;
        });
        res.on('end', function () {
            response = str;
            try {
                response = JSON.parse(response);
                for (var i = 0; i <= 10; i++) {
                    titlesArray.push(response[i].text);
                    var entry = {};
                    var news = (titlesArray[i].split('http'))[0];
                    var url = 'http' + (titlesArray[i].split('http'))[1];
                    entry.title = news;
                    entry.link = url;
                    dataObject.push(entry);
                }

                logData(dataObject);


            } catch(e) {
            console.log(e);
            return;
            }
        });
    });
    req.end();


};
