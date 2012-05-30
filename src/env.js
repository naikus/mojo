(function($, undef) {
   var undefn = undef,
      forEach = $.forEach,
      div = window.document.createElement("div"),
      style = div.style,
      
      prefixes = ["", "Webkit", "Moz", "O", "ms", "MS"],
      
      support = {
         hashchange: ("onhashchange" in window)
      },
      
      props = {}, 
      
      tests = {
         transition: function(env, support, props) {
            var t, transitionend = [
               "transitionend", "webkitTransitionEnd", "transitionend", 
               "oTransitionEnd", "MSTransitionEnd"
            ];
            forEach(prefixes, function(pfx, i) {
               var pt = pfx + "Transition";
               if(typeof style[pt] !== "undefined") {
                  t = support.transition = true;
                  props.transitionend = transitionend[i];
                  props.transition = pt; 
               }
            });
            if(!t) {
               props.transitionend = "transitionend";
            }
            return t;
         },
         
         transform: function(env, support, props) {
            var t;
            forEach(prefixes, function(pfx, i) {
               var pt = pfx + "Transform";
               if(typeof style[pt] !== "undefined") {
                  t = support.transform = true;
                  props.transform = pt; 
               }
            });
            return t;
         }
      };
      
   $.env = {
      supports: function(feature) {
         var s = support[feature], t;
         if(typeof s !== "undefined") {
            return s;
         }
         t = tests[feature];
         return typeof t === "function" ? t(this, support, props) : (support[feature] = false);
      },
      property: function(name) {
         return props[name];
      }
   }
})(h5);




