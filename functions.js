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

module.exports.registerUser = function(userData, callback) {
    hashPassword(userData.password, function(err, hash){
        var pgClient = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
        pgClient.connect();
        var query = 'INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id';
        pgClient.query(query, [userData.first, userData.last, userData.email, hash], function(err, results) {
            if (err) {
                console.log(err);
                res.redirect('/getaname');
            } else {
                var newId = results.rows[0].id;
                callback(null, newId);
            }
            pgClient.end();
        });
        client.del('cacheUserData', function(err, data) {
            if (err) {
                return console.log(err);
            }
            else {
                console.log('cache deleted!');
            }
        });
    });
};

var hashPassword = module.exports.hashPassword = function(password, callback) {
    console.log('passw: '+password);

    bcrypt.genSalt(function(err, salt) {
        if (err) {
            return callback(err);
        }
        bcrypt.hash(password, salt, function(err, hash) {
            if (err) {
                return callback(err);
            }
            console.log('hashedPassword login: '+hash);
            callback(null, hash);
        });
    });
};


module.exports.getData = function(callback) {
    var allData;
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
                console.log('allData:'+ allData);
                callback(null, allData);
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
            callback(null, allData);
        }
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
