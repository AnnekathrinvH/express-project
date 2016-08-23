var express = require('express');
var app = express();

var userName;

var getProjects = require('./getProjects');
var myProjectsObject = getProjects.getProjects();
console.log(myProjectsObject);

app.use(require('body-parser').urlencoded({
    extended: false
}));

app.use(require('cookie-parser')());

app.get('/getaname', function(req, res) {
    res.sendFile(__dirname + '/projects/name/index.html');
    app.use(express.static(__dirname + '/projects'));

});

var hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');


app.all('*', function(req, res, next) {
    userName = req.cookies.name;
    if (req.url === '/name') {
        next();
    }
    if ((userName === undefined || userName === ' ') && req.url != '/getaname') {
        console.log('redirected');
        res.redirect('/getaname');
    }
    if (userName) {
        console.log('name there');
        next();
    }

});

app.use(express.static(__dirname + '/projects'));


app.post('/name', function(req, res) {
    var fullName = req.body.first + ' '+ req.body.last;
    res.cookie('name', fullName);
    console.log('Cookies: ', req.cookies);
    res.redirect('hello/world');
});

app.get('/hello/world', function(req, res) {
    res.render('projectsPage', myProjectsObject);
});

app.listen(8080);
