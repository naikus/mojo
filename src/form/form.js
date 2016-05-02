/*
 * Simple CSS based toggle control
 */
(function($, undefined) {
   var action = "ontouchstart" in document.documentElement ? "tap" : "click";
   
   function renderUI(elem, state) {
      var e = elem.get(0);
      if(!e) {
        console.log("Toggle element not found");
        return;
      }
      if(state) {
         e.setAttribute("data-on", "true");
      }else {
         e.removeAttribute("data-on");
      }
      elem.dispatch("change", {isOn: state});
   }
   
   $.extension("toggle", function() {
     var elem = this,
         dataOn = elem.get(0).hasAttribute("data-on"),
         isOn = dataOn ? true : false;
        
     elem.on(action, function() {
       doToggle();
     });
     
     function doToggle() {
       isOn = !isOn;
       renderUI(elem, isOn);
     }
        
     return {
       on: function() {
         elem.on.apply(elem, arguments);
       },
       toggle: function() {
         doToggle();
       },
       setOn: function(bOn) {
         var on = !!bOn;
         if(isOn !== on) {
           isOn = on;
           renderUI(elem, isOn);
         }
       },
       isOn: function() {
         return isOn;
       }
     };
   });
   
})(h5);



(function($) {
   var action = "ontouchstart" in document.documentElement ? "tap" : "click";

   $.extension("expandable", function(opts) {
      var self = $(this.get(0)), options = opts || {}, 
          onchange = options.onchange,
          expanded = typeof(options.expanded) === "undefined" ? true : !!options.expanded,
          delay = options.delay || 100,
          widget;

      var trigger = $(self.children(".trigger")[0]);
      trigger.on(action, function() {
         setExpanded(!expanded);
      });

      function setExpanded(bEx) {
         var state = !!bEx;
         if(expanded !== state) {
           expanded = state;
           setTimeout(renderUI, delay);
         }
      }

      function renderUI() {
         if(expanded) {
            if(!self.hasClass("on")) {
               self.addClass("on");
            }
         }else {
            self.removeClass("on");
         }
         if(onchange) onchange.call(widget);
      }

      widget = {
         expand: setExpanded,
         isExpanded: function() {
            return expanded;
         }
      };
      
      if(expanded) {
         self.addClass("on");
      }
      
      return widget;
   });
})(h5);


(function($,undefined) {
    $.extension("slider", function(opts) {
        var self = this, options = $.shallowCopy({}, opts);
        
        
        (function() {
            if(!self.hasClass("slider")) {
                self.addClass("slider");
                self.html(['<div class="value"></div>', '<div class="thumb"></div>']);
            }
        })();
        
    });
})(h5);




/*
 * Progress Meter plugin
 */
(function($) {
   $.extension("progress", function(options) {
      var self = this, widget, valueElem, value = options ? options.value || 0 : 0;

      self.addClass("progress");
      self.append("<div class='value selected'></div>");

      valueElem = self.find("div.value");

      widget = {
         setValue: function(numVal) {
            value = Number(numVal) || 0;
            valueElem.css("width", value + "%");
         },

         getValue: function() {
            return value;
         }
      };
      
      widget.setValue(value);
      
      return widget;
      
   });
})($);


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

