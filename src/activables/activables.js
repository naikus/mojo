/*
 * A working solution for activable elements
 * Requires .activable and .activable.active classes to change appearance
 */
;(function($) {
   var touchstart = "touchstart", touchend = "touchend", touchmove = "touchmove";
   if(! ("ontouchstart" in document.documentElement)) {
        touchstart = "mousedown";
        touchmove = "mousemove";
        touchend = "mouseup";
   }
   
   $.extension("activables", function() {
      var element, timer, self = $(this);

      function activate() {
         // console.log("activating...");
         element.addClass("active");
      }

      function deactivate() {
         if(!element) return;
         // console.log("de-activating...");
         // console.log("removing listener");
         self.un(touchmove, move);
         element.removeClass("active");
         element = null;
      }

      function start(e) {
         if(element) {return;}
         
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
         
         // console.log("adding listener");
         self.on(touchmove, move);
         
         // start the timer
         timer = setTimeout(activate, 100);
      }

      function end(e) {
         if(element) {
            clearTimeout(timer);

            if(element.hasClass("active")) {
               deactivate();
            }else {
               element.addClass("active");
               setTimeout(deactivate, 100);
            }
         }
      }

      function move(e) {
         // console.log("move...");
         if(element) {
            // console.log("moved!! de-activating...");
            clearTimeout(timer);
            deactivate();
         }
      }

      // make all the activable elements change color when they are active
      self.on(touchstart, start).on(touchend, end);
   });
})(h5);



