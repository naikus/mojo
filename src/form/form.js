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



(function($) {
   var action = "ontouchstart" in document.documentElement ? "tap" : "click";

   $.extension("expandable", function(delay) {
      var self = this, expanded = false, delay = delay || 100;

      var trigger = $(self.children(".trigger")[0]);
      trigger.on(action, function() {
         setExpanded(!expanded);
      });

      function setExpanded(bEx) {
         expanded = bEx;
         setTimeout(renderUI, delay);
      }

      function renderUI() {
         if(expanded) {
            if(!self.hasClass("on")) {
               self.addClass("on");
            }
         }else {
            self.removeClass("on");
         }
      }

      if(trigger.hasClass("on")) {
         expanded = true;
      }

      return {
         expand: setExpanded,
         isExpanded: function() {
            expanded;
         }
      };
   });
})(h5);



   /*
   (function($) {
      var defaults = {
         icon: "icon-spinner",
         uri: null
      };
      $.extension("busyIndicator", function(opts) {
         var options = $.shallowCopy({}, defaults, opts), self = this,
               pattern = options.pattern,
               spinner = $('<span class="block spinner"><span class="' 
                       + options.icon 
                       + ' spin"> </span></span>');
         
         $(document).on("ajaxstart", function(e) {
               var url = e.data;
               if(pattern.test(url)) {
                  self.html(spinner);
               }
            })
            .on("ajaxend", function(e) {
               var url = e.data;
               if(pattern.test(url)) {
                  setTimeout(function() {
                     self.html("");
                  }, 300);
               }
            });
      });
   })($);
   */

