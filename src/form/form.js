/*
 * Simple CSS based toggle control
 */
/*
(function($) {
   var action = "ontouchstart" in document.documentElement ? "tap" : "click",
      noop = function() {};
      
   $.extension("toggle", function(opts) {
      opts = opts || {};
      var state = !!opts.value, elem = $(this.get(0)), onchange = opts.onchange || noop, widget;
      
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
*/

(function($, undefined) {
   $.observable = function() {
      var handlerMap = {};
      
      return {
         on: function(evt, handler) {
            var handlers = handlerMap[evt] || (handlerMap[evt] = []);
            handlers.push(handler);
         },
         
         un: function(evt, handler) {
            var handlers = handlerMap[evt] || (handlerMap[evt] = []);
            for(var i = 0, len = handlers.length; i < len; i++) {
               if(handlers[i] === handler) {
                  handlers.splice(i, 1);
                  break;
               }
            }
         },
         
         dispatch: function(evt) {
            var handlers = handlerMap[evt.type];
            if(!handlers) {
               return;
            }
            for(var i = 0, len = handlers.length; i < len; i++) {
               handlers[i](evt);
            }
         }
      };
   };
})(h5);


(function($, undefined) {
   var action = "ontouchstart" in document.documentElement ? "tap" : "click";
   
   function renderUI(elem, state) {
      if(state) {
         elem.addClass("on");
      }else {
         elem.removeClass("on");
      }
   }
         
   $.extension("toggle", function(values) {
      var self = this, state, len = self.count(), observable = $.observable(), observablesOne = $.observable();
      
      observablesOne.on("bobo", function() {});
      
      function doToggle(el, i) {
         var val = !state[i];
         state[i] = val;
         renderUI(el, val);
         observable.dispatch({type: "change", target: self, value: val, index: i});
      }
      
      if(values && values.length) {
         if(values.length < len) {
            values.length = len;
         }
         state = $.map(values, function(v, i) {
            return !!v;
         });
      }else {
         state = new Array(len);
      }
      
      self.forEach(function(elem, i) {
         var el = $(elem);
         el.on(action, function() {
            doToggle(el, i);
         });
      });
      
      return {
         element: self,
         
         on: function(type, handler) {
             observable.on(type, handler);
             return self;
         },
         
         toggle: function(index) {
            if(index >= state.length || index < 0) {
               return;
            }
            var el = $(self.get(index));
            doToggle(el, index);            
         },
         
         setOn: function(index) {
            if(index >= state.length || index < 0) {
               return;
            }
            var val = state[index];
            if(!val) {
               doToggle($(self.get(index)), index);
            }
         },
         
         isOn: function(index) {
            return !!state[index];
         }
      };
   });
})(h5);



(function($) {
   var action = "ontouchstart" in document.documentElement ? "tap" : "click";

   $.extension("expandable", function(delay) {
      var self = $(this.get(0)), expanded = false, delay = delay || 100;

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
*/


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

