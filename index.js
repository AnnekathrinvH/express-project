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




app.use(function(req, res, next) {
    userName = req.cookies.name;

    console.log('user name:'+ userName);
    console.log(req.url);

    if (userName) {
        console.log('name there');
        next();
    }

    if (userName === undefined && (req.url === '/name' || req.url === '/getaname')) {
        console.log('go on to name');
        next();
    }
    if ((userName === undefined) && req.url != '/getaname') {
        console.log('redirected');
        res.redirect('/getaname');
        next();
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
    console.log('name page');
    if (req.body.first && req.body.last) {
        var fullName = req.body.first + ' '+ req.body.last;
        res.cookie('name', fullName);
        res.redirect('myprojects');

    } else {
        userName = undefined;
        res.redirect('getaname');
    }
    console.log('Cookies: ', req.cookies);
});

app.get('/myprojects', function(req, res) {
    console.log(myProjects);
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
