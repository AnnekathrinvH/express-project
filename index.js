var express = require('express');
var app = express();
var userData = {};

var getProjects = require('./getProjects');
var myProjects = getProjects.getProjects();

var twitterRequest = require('./TwitterRequest');
twitterRequest.twitterTokenRequest();

var myFunctions = require('./functions');

app.use(require('body-parser').urlencoded({
    extended: false
}));


var hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

var pg = require('pg');

var util = require('util');

var getPassword = require('./credentials.json');
var dbPassword = getPassword.dbPassword;
console.log(dbPassword);

var redis = require('redis');
var client = redis.createClient({
    host: 'localhost',
    port: 6379
});

client.on('error', function(err) {
    console.log(err);
});

var session = require('express-session');
var Store = require('connect-redis')(session);

var bcrypt = require('bcrypt');

app.use(session({
    store: new Store({
        ttl: 3600,
        host: 'localhost',
        port: 6379
    }),
    resave: false,
    saveUninitialized: true,
    secret: 'my super fun secret'
}));


app.use(function(req, res, next) {
    user = req.session.userData;
    console.log('user name: '+user);
    console.log('url: '+req.url);

    if (user) {
        console.log('name there');
        return next();
    }
    if (user === undefined && (req.url === '/name' || req.url === '/getaname' || req.url === '/login')) {
        console.log('go on to name');
        return next();
    }
    if ((user === undefined) && req.url != '/getaname') {
        console.log('redirected');
        res.redirect('/getaname');
        return next();
    }
});

app.use(express.static(__dirname + '/projects'));



app.get('/getaname', function(req, res) {
    console.log('getaname!');
    res.sendFile(__dirname + '/projects/name/index.html');
});

app.get('/twitter', function(req,res) {
    twitterRequest.twitterDataRequest().then(function(data) {
        res.send(data);
    });
});

app.post('/name', function(req, res) {
    console.log('redirected to name');

    if (req.body.first && req.body.last && req.body.email && req.body.password) {
        var password = req.body.password;
        myFunctions.hashPassword(password, res, req, myFunctions.insertUserData, userData);

    } else {
    user = undefined;
    res.redirect('/getaname');
    }
});

app.get('/changeUserData', function(req, res) {
    //get current Data
    console.log('change your data!');

    var userId = req.session.userData.dbid;
    var query = 'SELECT * FROM users JOIN user_profile ON users.id=user_profile.id WHERE user_profile.id = $1';

    var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
    client.connect();
    client.query(query, [userId], function(err, results) {
        if(err) {
            console.log(err);
        }
        var currentUser = results.rows;
        console.log(currentUser);
        client.end();
        res.render('editDataPage', {
            currentUser: currentUser
        });
    });
});

app.post('/sendChangeUserData', function(req, res) {
    var updatedFirst = req.body.first.toUpperCase();
    var updatedLast = req.body.last.toUpperCase();
    var updatedEmail = req.body.email.toUpperCase();
    var updatedPassw = req.body.password;
    var updatedAge = req.body.age;
    var updatedCity = req.body.city.toUpperCase();
    var updatedHomepage = req.body.homepage.toUpperCase();
    var updatedColor = req.body.color.toUpperCase();
    var userId = req.session.userData.dbid;
    console.log(typeof updatedAge);
    console.log([updatedAge, updatedCity, updatedHomepage, updatedColor, userId]);
    console.log(updatedCity);
    console.log(updatedHomepage);

    var userDbQuery = 'UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4 WHERE id = $5';
    var profileDbQuery = 'UPDATE user_profile SET age = $1, city = $2, homepage = $3, color = $4 WHERE id = $5';
    var profileArray = [updatedAge, updatedCity, updatedHomepage, updatedColor, userId];

    hashPassword(updatedPassw, updateDb);

    function hashPassword(plainTextPassword, callback) {
    bcrypt.genSalt(function(err, salt) {
        if (err) {
            return callback(err);
        }
        console.log(salt);
        bcrypt.hash(plainTextPassword, salt, function(err, hash) {
            if (err) {
                return callback(err);
            }
            console.log(hash);
            var userArray = [updatedFirst, updatedLast, updatedEmail, hash, userId];
            callback(null, userDbQuery, userArray, updateDb);
        });
    });
}
    function sendRes() {
        res.send('changed');
    }

    function updateDb(err, query, queryArray, callback) {
        if (err) {
            console.log(err);
            return;
        }
        var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
        client.connect();
        client.query(query, queryArray, function(err, results) {
            if (err) {
                console.log(err);
                return;
            } else {
                console.log(results);
                client.end();
                callback(null, profileDbQuery, profileArray, sendRes);
            }
        });
    }

});

app.post('/moreUserData', function(req, res) {
    console.log('more');
    var age = req.body.age;
    var city = req.body.city.toUpperCase();
    var homepage = req.body.homepage.toUpperCase();
    var color = req.body.color.toUpperCase();
    var dbid = req.session.userData.dbid;
    var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
    client.connect();
    var query = 'INSERT INTO user_profile (age, city, homepage, color, id) VALUES ($1, $2, $3, $4, $5)';

    client.query(query, [age, city, homepage, color, dbid], function(err, results) {
        if (err) {
            console.log(err);
        } else {
            console.log(results);
            client.end();
            res.redirect('users');
        }
    });
});

app.get('/users', function(req, res) {
    console.log('Cookies: ', req.session);
    var allData;
    var query = 'SELECT * FROM users JOIN user_profile ON users.id=user_profile.id';
    myFunctions.getData(query, null, myFunctions.renderUserDataPage, req, res);
});



app.get('/myprojects', function(req, res) {
    res.render('projectsPage', {
        myProjects
    });
});

app.get('/:project/description', function(req, res) {
    req.params.project(function(err) {
        console.log(err);
        return;
    });
    console.log('projects!!');
    for (var i = 0; i < myProjects.length; i++) {

        if (myProjects[i].name === req.params.project) {
            var directory = './projects/' + req.params.project + '/' + req.params.project + '.json';
            var jsonDescription = require(directory);
            console.log(jsonDescription);
            res.render('projectsDescription', {
                jsonDescription: jsonDescription,
                layout: 'layout'
            });
        }
    }

});

app.post('/login', function(req, res) {
    console.log('login');
    var submittedFirstName = req.body.checkFirst.toUpperCase();
    var submittedLastName = req.body.checkLast.toUpperCase();
    var submittedPassword = req.body.checkPassword;

    console.log(submittedFirstName+submittedLastName);

    var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
    client.connect();
    var query = 'SELECT * FROM users WHERE users.first_name = $1 AND users.last_name = $2';
    client.query(query, [submittedFirstName, submittedLastName], function(err, results) {
        if (err) {
            console.log(err);
        }
        var allData = results.rows;
        console.log(results.rows);
        var hashedPassword = allData[0].password;
        console.log('submittedPassword ' +submittedPassword);
        checkPassword(submittedPassword, hashedPassword, authorized);
        client.end();
    });

    function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase, callback) {
    bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function (err, doesMatch) {
        if (err) {
            return callback(err);
        }
        console.log(doesMatch);
        callback(null, doesMatch);
    });
    }
    function authorized(err, doesMatch) {
        if (err) {
            console.log(err);
        }
        if (doesMatch) {
            userData.name = submittedFirstName + submittedLastName;
            req.session.userData = userData;
            res.send('logged in!');
        } else {
        res.send('no access');
    }
    }

});
app.get('/logout', function(req, res) {
    req.session.destroy(function(err) {
        if (err) {
        console.log(err);
    }
    console.log('logged out');
    });
    res.redirect('/getaname');
});
app.listen(8080);
