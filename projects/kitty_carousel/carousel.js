(function() {

      var kitties = document.getElementsByClassName('kitty');
      var dots = [].slice.call(document.getElementsByClassName('dot'));
      var on = 0;
      var standby = 1;
      var timer;

    function changeKittyState() {
        kitties[on].classList.remove('on');
        kitties[standby].classList.remove('standby');
          kitties[standby].classList.add('on');

          dots[on].classList.remove('active');
          dots[standby].classList.add('active');

          standby++;
          on = standby -1;
          if(standby >= kitties.length) {
            standby = 0;
          }
          kitties[standby].classList.add('standby');

          isTransitioning = true;
          kitties[on].addEventListener('transitionend', transitionEndHandler);
    }

      function transitionEndHandler() {
            timer = setTimeout(changeKittyState, 2000);
            this.removeEventListener('transitionend', transitionEndHandler);
            isTransitioning = false;
      }


      dots.forEach(function(dot, n) {
        dot.addEventListener('click', function() {
            if (isTransitioning) {
                return;
            }
            for(var i = 0; i < kitties.length; i++) {
              kitties[i].classList.remove('on');
              kitties[i].classList.remove('standby');
            }

            clearTimeout(timer);
            standby = n;
            changeKittyState();
        })
      })

      timer = setTimeout(changeKittyState, 2000);
})();

/*add and remove event listener, transitionend event, click: ignore during transition
 add isTransitioning = false to listener
 forEach eine aktion für jeden item in einem array
*/
