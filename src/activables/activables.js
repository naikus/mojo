/*
 * A working solution for activable elements
 * Requires .activable and .activable.active classes to change appearance
 */
(function($) {
   var touchstart = "touchstart", touchend = "touchend", touchmove = "touchmove";
   if(! ("ontouchstart" in document.documentElement)) {
        touchstart = "mousedown";
        touchmove = "mousemove";
        touchend = "mouseup";
   }
   
   $.extension("activables", function() {
      var element, timer;

      function activate() {
         element.addClass("active");
      }

      function deactivate() {
         if(!element) return;
         
         element.removeClass("active");
         element = null;
      }

      function start(e) {
         var level = 3, target = e.target, elem;
         while(level-- && target) {
            elem = $(target);
            if(elem.hasClass("activable") || elem.hasClass("button")) {
               element = elem;
            }else {
               target = target.parentNode;
            }
         }

         if(!element) {
            return;
         }
         // start the timer
         timer = setTimeout(activate, 100);
      }

      function end(e) {
         if(element) {
            clearTimeout(timer);

            if(element.hasClass("active")) {
               element.removeClass("active");
               element = null;
            }else {
               element.addClass("active");
               setTimeout(deactivate, 150);
            }
         }
      }

      function move(e) {
         if(element) {
            clearTimeout(timer);
            element.removeClass("active");
            element = null;
         }
      }

      // make all the activable elements change color when they are active
      $(this).on(touchstart, start).on(touchmove, move).on(touchend, end);
   });
})(h5);



