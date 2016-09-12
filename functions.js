var bcrypt = require('bcrypt');

var pg = require('pg');
var getPassword = require('./credentials.json');
var dbPassword = getPassword.dbPassword;

var redis = require('redis');
var client = redis.createClient({
    host: 'localhost',
    port: 6379
});

client.on('error', function(err) {
    console.log(err);
});


module.exports.hashPassword = function(password, callback) {
    console.log('passw: '+password);

    bcrypt.genSalt(function(err, salt) {
        if (err) {
            return callback(err);
        }
        bcrypt.hash(password, salt, function(err, hash) {
            if (err) {
                return callback(err);
            }

            callback(null, hash);
        });
    });
};


module.exports.getData = function(err, callback, req, res) {
    client.get('cacheUserData', function(err, data){
        if (err) {
            return console.log(err);
        }
        if (data === null) {
            var pgClient = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
            pgClient.connect();
            var query = 'SELECT * FROM users JOIN user_profile ON users.id=user_profile.id';

            pgClient.query(query, function(err, results) {
                allData = results.rows;
                console.log('res:'+res);
                console.log('allData:'+ allData);
                callback(req, res);
                pgClient.end();
                var cacheUserData = JSON.stringify(allData);
                client.set('cacheUserData', cacheUserData, function(err, data) {
                    if (err) {
                        console.log(err);
                    }
                    else {console.log('data was stored!');
                    }
                });
            });
        } else {
            console.log('cacheData');
            allData = JSON.parse(data);
            callback(req, res);
        }
    });
};

module.exports.renderUserDataPage = function(req, res) {
    var colorArray = [];
    var cityArray = [];
    var selectedColor = req.query.color;
    var selectedCity = req.query.city;
    console.log('res in renderUserDataPage: '+res);

    getUniques('color', colorArray);
    getUniques('city', cityArray);

    function getUniques(selected, myArray) {
        var unique = {};
        for (var i = 0; i < allData.length; i++) {
            var key = allData[i][selected];
            unique[key] = selected;
        }
        for (var colorKey in unique) {
            var entry = {};
            entry[selected] = colorKey;
            myArray.push(entry);
        }
    }
    if (selectedColor && selectedCity === undefined) {
        allData = allData.filter(function(obj) {
            return obj.color === selectedColor;
        });
    }
    if (selectedCity && selectedColor === undefined) {
        allData = allData.filter(function(obj) {
            return obj.city === selectedCity;
        });
    }
    if (selectedCity && selectedColor) {
        allData = allData.filter(function(obj) {
            return obj.color === selectedColor && obj.city === selectedCity;
        });
    }

    res.render('userDataTable', {
        colorArray: colorArray,
        cityArray: cityArray,
        allData: allData
    });
};

module.exports.checkPassword = function(textEnteredInLoginForm, hashedPasswordFromDatabase, callback) {
bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function (err, doesMatch) {
    if (err) {
        return callback(err);
    }
    console.log(doesMatch);
    callback(null, doesMatch);
});
};
