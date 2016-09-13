var express = require('express');
var app = express();
var userData = {};

var getProjects = require('./getProjects');
var myProjects = getProjects.getProjects();

var twitterRequest = require('./TwitterRequest');
twitterRequest.twitterTokenRequest();

var myFunctions = require('./functions');

var csrf = require('csurf');

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

app.use(csrf());

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
    res.render('namePage', {
        csrfToken: req.csrfToken()
    });
});

app.get('/twitter', function(req,res) {
    twitterRequest.twitterDataRequest().then(function(data) {
        res.send(data);
    });
});

app.post('/name', function(req, res) {
    console.log('redirected to name');

    if (req.body.first && req.body.last && req.body.email && req.body.password) {
        var userData = {
            first: req.body.first.toUpperCase(),
            last: req.body.last.toUpperCase(),
            email: req.body.email.toUpperCase(),
            password: req.body.password
        };
        myFunctions.registerUser(userData, function(err, dbId) {
            if (err) {
                res.redirect('/getaname');
            } else {
                userData.dbId = dbId;
                req.session.userData = userData;
                res.redirect('/moreUserData');
            }
        });
    } else {
    user = undefined;
    res.redirect('/getaname');
    }
});

app.get('/changeUserData', function(req, res) {
    console.log('change your data!');
    var userId = req.session.userData.dbId;
    console.log('userData: '+req.session.userData.dbId);
    var query = 'SELECT * FROM users JOIN user_profile ON users.id=user_profile.id WHERE user_profile.id = $1';

    var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
    client.connect();
    client.query(query, [userId], function(err, results) {
        if(err) {
            return console.log(err);
        }
        var currentUser = results.rows;
        console.log(currentUser);
        client.end();
        res.render('editDataPage', {
            currentUser: currentUser,
            csrfToken: req.csrfToken()
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
    var userId = req.session.userData.dbId;
    console.log(typeof updatedAge);
    console.log([updatedAge, updatedCity, updatedHomepage, updatedColor, userId]);
    console.log(updatedCity);
    console.log(updatedHomepage);

    myFunctions.hashPassword(updatedPassw, function(err, hash) {
        if (err) {
            return console.log(err);
        }
        var query = 'UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4 WHERE id = $5';
        var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
        client.connect();
        client.query(query, [updatedFirst, updatedLast, updatedEmail, hash, userId], function(err, results) {
            if (err) {
                return console.log(err);
            } else {
                console.log(results);
                client.end();
                updateProfileDb(null);
            }
        });
    });

    function updateProfileDb(err) {
        if (err) {
        return console.log(err);
        }
        var query = 'UPDATE user_profile SET age = $1, city = $2, homepage = $3, color = $4 WHERE id = $5';
        var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
        client.connect();
        client.query(query, [updatedAge, updatedCity, updatedHomepage, updatedColor, userId], function(err, results) {
            if (err) {
                return console.log(err);
            } else {
                console.log(results);
                client.end();
                sendRes(null);
            }
        });
    }

    function sendRes(err) {
        if (err) {
            return console.log(err);
        }
        res.send('changed');
    }
});

app.get('/moreUserData', function(req, res) {
    res.render('moreData', {
        csrfToken: req.csrfToken()
    });
});


app.post('/sendMoreData', function(req, res) {
    console.log('more');
    var age = req.body.age;
    var city = req.body.city.toUpperCase();
    var homepage = req.body.homepage.toUpperCase();
    var color = req.body.color.toUpperCase();
    var dbId = req.session.userData.dbId;
    var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
    client.connect();
    var query = 'INSERT INTO user_profile (age, city, homepage, color, id) VALUES ($1, $2, $3, $4, $5)';

    client.query(query, [age, city, homepage, color, dbId], function(err, results) {
        if (err) {
            return console.log(err);
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
    myFunctions.getData(function(err, allData) {
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
    });
});

app.get('/myprojects', function(req, res) {
    res.render('projectsPage', {
        myProjects: myProjects
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
    var allData;
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
        allData = results.rows;
        var hashedPassword = allData[0].password;
        console.log('hashedPassword: '+hashedPassword);

        myFunctions.checkPassword(submittedPassword, hashedPassword, authorized);
        client.end();
    });


    function authorized(err, doesMatch) {
        if (err) {
            console.log(err);
        }
        if (doesMatch) {
            var userData = {
                first: allData[0].first_name,
                last: allData[0].last_name,
                email: allData[0].email,
                dbId: allData[0].id
            };
            console.log('authorized Id: '+userData.dbId);
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
