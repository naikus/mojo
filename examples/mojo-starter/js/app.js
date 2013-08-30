window.SERVER_URL = "/";

// uncomment for mobile android app
// window.SERVER_URL = "https://example.com/";

/*
 * Array.indexOf polyfill (for IE 8 and others)
 * Taken from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
 */
(function() {
   if (!Array.prototype.indexOf) {
       Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
           "use strict";
           if (this == null) {
               throw new TypeError();
           }
           var t = Object(this);
           var len = t.length >>> 0;
           if (len === 0) {
               return -1;
           }
           var n = 0;
           if (arguments.length > 1) {
               n = Number(arguments[1]);
               if (n != n) { // shortcut for verifying if it's NaN
                   n = 0;
               } else if (n != 0 && n != Infinity && n != -Infinity) {
                   n = (n > 0 || -1) * Math.floor(Math.abs(n));
               }
           }
           if (n >= len) {
               return -1;
           }
           var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
           for (; k < len; k++) {
               if (k in t && t[k] === searchElement) {
                   return k;
               }
           }
           return -1;
       }
   }
})();



/*
 * Geolocation plugin 
 */
(function($) {
   if("geolocation" in navigator) {
      var lat = 0, lng = 0, hasError, errorMessage, posOptions = {
         enableHighAccuracy: false,
         timeout: 10000,
         maximumAge: (5 * 60 * 1000)
      };

      function updatePosition(pos) {
         hasError = false;
         errorMessage = "";

         lat = pos.coords.latitude;
         lng = pos.coords.longitude;
      }

      function handleError(error) {
         var msg = "Error obtaining your location";
         switch(error.code) {
            case 1:
               msg = "You need to share your location to correctly determine where you are.";
               break;
            case 2:
               msg = "Location unavailable. " + error.message;
               break;
            case 3:
               msg = "Location lookup timed out.";
               break;
            default:
               break;
         }
         hasError = true;
         errorMessage = msg;
      }
   
      /* Uncomment if you want to enable geo-location */
      /*
      navigator.geolocation.getCurrentPosition(updatePosition, handleError, posOptions);
      navigator.geolocation.watchPosition(updatePosition, handleError, posOptions);
      */
      
      $.GeoLocation = {
         lat: function() {
            return lat;
         },
         lng: function() {
            return lng;
         },
         hasError: function() {
            return hasError;
         },
         getErrorMessage: function() {
            return errorMessage;
         }
      };
   }
})(h5);



/*
 * Ryde API client
 */
(function($, undefined) {
   var defaults = {
      baseUrl: window.SERVER_URL + "some/api/version",
      headers: {
        "Content-Type": "application/json" 
      }
   }, 
   empty = {};

   /*
    * REST API plugin that allows calling various api methods using oAuth protocol.
    * uses http-like method names to do rest calls.
    * e.g. 
    * <code>
    * REST     METHOD  
    * ----------------
    * delete   del
    * create   post
    * update   put
    * get      get
    * ----------------
    * </code>
    * 
    * The Api object exposes four methods that map to crud operations.
    * <code>
    * get, post, put, del
    * </code>
    * All of these take following an options object with following parameters.
    * <code>
    * options = {
    *    apiMethod: The API method to call. e.g. "user/loginWithTwitter"
    *    data: An object containing additional data required to call the 'apiMethod'
    *    success: An optional callback function to call upon successful call of the 'apiMethod'
    *    failure: An optional callback function to call upon failure calling the 'apiMethod'
    * }
    * </code>
    */
   $.Api = function(options) {
      var forEach = $.forEach,
              isArray = $.isArray,
              getTypeOf = $.getTypeOf,
              opts = $.shallowCopy({}, defaults, options),
              noop = function() {},
              GeoLocation = $.GeoLocation,
              doc = $(document),
              ret = {};

      function asParams(key, val, arrPostData) {
         if(isArray(val)) {
            encodeArray(key, val, arrPostData);
         }else if(getTypeOf(val) === "Object") {
            encodeObject(key, val, arrPostData);
         } else {
            var k = key ? encodeURIComponent(key) + "=" : "";
            arrPostData.push(k + encodeURIComponent(val));
         }
      }

      function encodeObject(key, objVal, arrPostData) {
         forEach(objVal, function(v, k) {
            var newKey = key ? key + "." + k : k;
            asParams(newKey, v, arrPostData);
         });
      }

      function encodeArray(key, arrVals, arrPostData) {
         for (var i = 0, len = arrVals.length; i < len; i++) {
            asParams(key, arrVals[i], arrPostData);
         }
      }
      
      /**
       * Calls an API method using one of the http methods
       * @param {String} method The http method. One of get|post|put|delete
       * @param {Object} options The additional parameters for this api call.
       * The options parameter should contain following:
       * <code>
       * options = {
       *    apiMethod: The API method to call. e.g. "user/loginWithTwitter"
       *    data: An object containing additional data required to call the 'apiMethod'
       *    success: An optional callback function to call upon successful call of the 'apiMethod'
       *    failure: An optional callback function to call upon failure calling the 'apiMethod'
       * }
       * </code>
       */
      
      function apiCall(method, options) {
         var apiMethod = opts.baseUrl + (options.apiMethod || ""), 
                 reqData, headers = $.shallowCopy({}, defaults.headers, options.headers);
         // console.log("Calling API method " + apiMethod);
         
         if(options.data) {
            if(method === "GET") {
               reqData = options.data;
            }else if(method === "DELETE") {
               reqData = null;
            }else {
               if(headers["Content-Type"] === "application/x-www-form-urlencoded") {
                  if(typeof options.data === "string") {
                     reqData = options.data;
                  }else {
                     var postData = [];
                     asParams(null, options.data, postData);
                     reqData = postData.join("&");
                  }
               }else {
                  headers["Content-Type"] = "application/json";
                  reqData = JSON.stringify(options.data);
               }
            }
         }
         
         // update the geo latitude and longitude
         if(GeoLocation) {
            headers["X-Mojo-Geo-Lat"] = GeoLocation.lat();
            headers["X-Mojo-Geo-Lng"] = GeoLocation.lng();
         }
         
         $.ajax({
            url: apiMethod + "?" + new Date().getTime(),
            method: method,
            data: reqData,
            headers: headers,
            dataType: options.dataType || "json",
            success: function(data) {
               // console.log(["SUCCESS", "method", apiMethod, JSON.stringify(data)].join(" "));
               var err;
               if((err = data.error)) {
                  (options.failure || noop)(data);
               } else {
                  (options.success || noop)(data);
               }
            },
            error: function(code) {
               // console.log(["ERROR", "method", apiMethod, JSON.stringify(code)].join(" "));
               doc.dispatch("apierror", {api: options.apiMethod, data: code});
            }
         });
      }

      $.forEach("get post put delete".split(' '), function(m) {
         var name = (m === "delete") ? "del" : m;
         ret[name] = function(apiUrl, options) {
            options.apiMethod = apiUrl;
            apiCall(m.toUpperCase(), options);
         };
      });
      
      ret.asParams = function(objData) {
         var paramArray = [];
         asParams(null, objData, paramArray);
         return paramArray.join("&");
      };

      return ret;
   };
})(h5);



/*
 * $.copyOf(Object) plugin
 */
(function($, undefined) {
  /**
   * Recursively copy an object into to return a new object. Handles nested structures like arrays and objects
   * Warning!! Does not handle circular references
   * @param {Any} obj
   * @returns {Any} The newly copied object
   */
   $.copyOf = function copyOf(obj) {
      var type = $.getTypeOf(obj), copy;
      switch(type) {
         case "Object":
           copy = {};
           if(obj != null) {
              $.forEach(obj, function(val, key) {
                 copy[key] = copyOf(val);
              });
           }
           break;
        case "Array":
           copy = [];
           for(var i = 0, len = obj.length; i < len; i++) {
              copy[i] = copyOf(obj[i]);
           }
           break;
        case "Date":
           copy =  new Date(obj.getTime());
           break;
        default:
           copy = obj;
           break;
      }
      return copy;
   };
})(h5);




/* ------------------------------- Application Code And Initialization ---------------------------------------- */

(function(window, $, undefined) {   

   
   // set the default user action event (tap in touch enabled browsers or fallback to click
   var Events = {
            tap: "tap",
            taphold: "taphold",
            touchstart: "touchstart",
            touchend: "touchend",
            touchmove: "touchmove"
         },
         doc = $(document),
         Api = $.Api(),
         App = $.Application();
         
   if(! ("ontouchstart" in document.documentElement)) {
      Events = {
        tap: "click",
        taphold: "mousedown",
        touchstart: "mousedown",
        touchend: "mouseup",
        touchmove: "mousemove"
      };
   }
      
   /*
    * App global messages, plugin
    */
   (function($) {
      $.extension("messages", function() {
         var self = this, uuid = $.uuid, 
            widget = {
                clear: function(id) {
                  if(id) {
                     self.remove("#" + id);
                     if(self.children().length === 0) {
                        self.addClass("hidden");
                     }
                     return;
                  }
                  self.html("");
                  self.addClass("hidden");
               }
            };

        function message(type, msg, bSticky) {
           var id = "msg_" + uuid();
           self.append('<p id="' + id + '" class="message ' + type + '">' + msg + '</p>');
           self.removeClass("hidden");
           if(bSticky !== true) {
              setTimeout(function() {
                 widget.clear(id);
              }, 4000);
           }
        }

        $.forEach(["info", "error", "success", "warn"], function(val) {
           widget[val] = function(msg, sticky) {
              message(val, msg, sticky);
           };
        });

        self.on(Events.tap, function() {
           widget.clear();
        });

        return widget;
     });
   })($, Events);
     
      
   /*
    * Toolbar plugin
    */
   (function($, Events, App) {
      var defaultActions = {
         back: function() {
            App.popView();
         },
         route: function(elem) {
            App.loadView(elem.attr("data-template"), elem.attr("data-path"));
         },
         logout: function() {
            console.log("Logging out");
         },
         toggleMainMenu: function(elem) {
            var viewPort = $("#viewPort");
            if(viewPort.hasClass("reveal-appmenu")) {
               viewPort.removeClass("reveal-appmenu");
            }else {
               viewPort.addClass("reveal-appmenu");
            }
         }
      };

      $.extension("toolbar", function(acts) {
         var actions = $.shallowCopy({}, defaultActions, acts), self = this;

         self.on(Events.tap, function(e) {
            var target = e.target, elem = $(target), strAct, handler;
            if(elem.hasClass("action")) {
               strAct = elem.attr("data-action");
               // console.log("Action is: " + strAct);
               if(strAct && (handler = actions[strAct])) {
                  handler(elem);
               }
            }
         });
      });
   })($, Events, App);
      
   /*
    * Meter plugin
    */
   (function($) {
      $.extension("meter", function(options) {
         var self = this, valueElem, value = options ? options.value || 0 : 0;

         self.addClass("meter");
         self.append("<div class='value selected'></div>");

         valueElem = self.find("div.value");

         return {
            setValue: function(numVal) {
               value = Number(numVal) || 0;
               valueElem.css("width", value + "%");
            },

            getValue: function() {
               return value;
            }
         };
      });
   })($);
      
      
   window.Events = Events;
   window.Api = Api;
   window.Application = App;

   // enable touch activable using the mojo activables plugin
   doc.activables();

   // initialize our application on ready ------------------------------------------------------------
   $.ready(function() {
      var vPort = $("#viewPort");

      // hide the URL bar when a view transitions in
      /*
      vPort.on("viewtransitionin", function() {
         var doc = window.document, 
            yOffset = window.pageYOffset || doc.compatMode === "CSS1Compat" && 
                      doc.documentElement.scrollTop || doc.body.scrollTop || 0;               
         setTimeout(function() {
            if(yOffset < 20) {
               window.scrollTo(0, 1);
            }
         }, 30);
      });
      */

      // Messages
      window.Messages = $("#messages").messages();

      // handle API errors (network, etc.)
      /*
      doc.on("apierror", function(e) {
          window.Messages.error("Error calling API " + e.api + ". Message: " + e.data);
      });
      */

      // set up toast messages
      var loading = $("#loading"); 
      doc.on("ajaxstart", function() {
         loading.addClass("show");
      }).on("ajaxend", function() {
         loading.removeClass("show");
      });

      // initialize our app
      App.initialize({
         viewPort: vPort, 
         loadFromPath: false,
         startView: "/tabView"
      });

      /*
      if(typeof google !== "undefined") {
         google.maps.visualRefresh = true;
      }
      */
   });
   
})(window, h5);