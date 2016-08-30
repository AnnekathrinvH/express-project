(function() {
    var templates = document.querySelectorAll('script[type="text/handlebars"]');

    Handlebars.templates = Handlebars.templates || {};

    Array.prototype.slice.call(templates).forEach(function(script) {
    Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
    });

    var data;
    var xhr = new XMLHttpRequest;
    xhr.open('GET', '/twitter');

    xhr.addEventListener('readystatechange', function() {
        if (xhr.readyState != XMLHttpRequest.DONE) {
            return;
        }
        var status;
        try {
            status = xhr.status;
        } catch(e) {
            return;
        }
        if (status != 200) {
            return;
        }
        var responseText = xhr.responseText;
        try {
            data = JSON.parse(responseText);
        }
        catch (e) {
            return;
        }

        ticker();
    });

    xhr.send();


    function ticker(){

        var ticker = document.getElementById('container');
        var newPosition = ticker.offsetLeft;

        var id;

        insertLinks();
        function insertLinks() {
            var tickerHTML = Handlebars.templates.ticker(data);
            ticker.innerHTML += tickerHTML;
        }

        function moveTicker() {
            newPosition = newPosition-1;
            ticker.style.left = newPosition + "px";
            id = window.requestAnimationFrame(moveTicker);
            var links = document.getElementsByTagName('a');
            var firstWidth = links[1].offsetLeft;

            if (newPosition < -firstWidth) {
                var old = ticker.removeChild(links[0]);
                newPosition += firstWidth;
                ticker.style.left = newPosition + 'px';
                ticker.appendChild(old);
            }
        }

        function stopTicker() {
            window.cancelAnimationFrame(id);
            ticker.removeEventListener('mouseover', stopTicker);
            ticker.addEventListener('mouseout', startTicker);
            console.log(id);
        }

        function startTicker() {
            moveTicker();
            console.log('start');
            ticker.removeEventListener('mouseout', startTicker);
            ticker.addEventListener('mouseover', stopTicker);

        }

        moveTicker();
        ticker.addEventListener('mouseover', stopTicker);

    }
})();
