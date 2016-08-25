var fs = require('fs');
var pathModule = require('path');


module.exports.getProjects = function() {
    var myProjects = [];

    getLinks();
    function getLinks() {
        var firstPath = __dirname +'/projects';
        readDirectory(firstPath);

        function readDirectory(path) {
            var directories = fs.readdirSync(path);
            for (var i = 0; i < directories.length; i++) {
                var title = directories[i];
                checkStatus(path, title);
            }
        }
        function checkStatus(path, title) {
            var newPath = '/'+ title;
            var entry = {};
            entry.name = title;
            entry.url = newPath;
            myProjects.push(entry);
        }
    }

    return myProjects;
};
