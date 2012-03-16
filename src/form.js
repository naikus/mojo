/**
 * Simple CSS based toggle control
 */
(function($) {
   var action = document.createTouch ? "tap" : "click";
   $.extension("toggle", function(isOn) {
      var state = !!isOn, elem = this;
      
      function renderUi() {
         if(state) {
            elem.addClass("on");
         }else {
            elem.removeClass("on");
         }
      }
      
      elem.on(action, function() {
         state = !state;
         // elem.dispatch("change");
         renderUi();
      });
      
      renderUi();
      
      return {
         toggle: function() {
            state = !state;
            renderUi();
         },
         setOn: function(bOn) {
            state = !!bOn;
            renderUi();
         },
         isOn: function() {
            return state;
         }
      };
   });
})(h5);



