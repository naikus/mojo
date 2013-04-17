/*
 * Simple CSS based toggle control
 */
(function($) {
   var action = "ontouchstart" in document.documentElement ? "tap" : "click",
      noop = function() {};
      
   $.extension("toggle", function(opts) {
      opts = opts || {};
      var state = !!opts.value, elem = this, onchange = opts.onchange || noop, widget;
      
      function renderUi() {
         if(state) {
            elem.addClass("on");
         }else {
            elem.removeClass("on");
         }
      }
      
      elem.on(action, function() {
         state = !state;
         renderUi();
         onchange.call(widget, state);
      });
      
      renderUi();
      
      widget = {
         element: elem,
         toggle: function() {
            state = !state;
            renderUi();
            onchange.call(widget, state);
         },
         setOn: function(bOn) {
            var old = state;
            state = !!bOn;
            if(old !== state) {
               renderUi();
               onchange.call(widget, state);
            }
         },
         isOn: function() {
            return state;
         },
         getValue: function() {
            return state;            
         }
      };
      
      return widget;
   });
})(h5);



