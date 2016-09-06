var express = require('express');
var app = express();

var userName;
var getProjects = require('./getProjects');
var myProjects = getProjects.getProjects();

var twitterRequest = require('./TwitterRequest');
twitterRequest.twitterTokenRequest();

app.use(require('body-parser').urlencoded({
    extended: false
}));

app.use(require('cookie-parser')());

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



app.use(function(req, res, next) {
    userName = req.cookies.name;
    console.log('user name: '+userName);
    console.log('url: '+req.url);

    if (userName) {
        console.log('name there');
        return next();
    }
    if (userName === undefined && (req.url === '/name' || req.url === '/getaname')) {
        console.log('go on to name');
        return next();
    }
    if ((userName === undefined) && req.url != '/getaname') {
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
    var userData = {};
    var newId;
    var cookieData;

    if (req.body.first && req.body.last) {
        console.log('if '+req.body.first);
        var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
        client.connect();
        var first = req.body.first.toUpperCase();
        var last = req.body.last.toUpperCase();

        var query = 'INSERT INTO user_names (first_name, last_name) VALUES ($1, $2) RETURNING id';
        client.query(query, [first, last], function(err, results) {
            if (err) {
                console.log(err);
            } else {
                newId = results.rows[0].id;
                userData.first = first;
                userData.last = last;
                userData.dbid = newId;
                cookieData = JSON.stringify(userData);
                console.log(cookieData);

            }
            client.end();
            res.cookie('name', cookieData);
            res.redirect('moreUserData');
        });

    } else {
        console.log('paranoia');
        userName = undefined;
        res.redirect('getaname');
    }


});



app.post('/moreUserData', function(req, res) {
    console.log('more');
    var age = req.body.age;
    var city = req.body.city.toUpperCase();
    var homepage = req.body.homepage.toUpperCase();
    var color = req.body.color.toUpperCase();
    var dbid = JSON.parse((req.cookies).name).dbid;
    var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
    client.connect();
    var query = 'INSERT INTO user_profile (age, city, homepage, color, id) VALUES ($1, $2, $3, $4, $5)';

    client.query(query, [age, city, homepage, color, dbid], function(err, results) {
        console.log(results);
        client.end();
        res.redirect('users');
    });



});

app.get('/users', function(req, res) {
    console.log('Cookies: ', req.cookies);
    var colorArray = [];
    var cityArray = [];
    var selectedColor = req.query.color;
    var selectedCity = req.query.city;
    var allData;

    client.get('userData', function(err, reply){
        if (reply === null) {

        }
    })
    var client = new pg.Client('postgres://postgres:'+dbPassword+'@localhost:5432/users');
    client.connect();
    var query = 'SELECT * FROM user_names JOIN user_profile ON user_names.id=user_profile.id';
    client.query(query, function(err, results) {
        allData = results.rows;

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
        client.end();
    });
});



app.get('/myprojects', function(req, res) {
    res.render('projectsPage', {
        myProjects
    });
});

app.get('/:project/description', function(req, res) {
    req.params.project;
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

app.listen(8080);
