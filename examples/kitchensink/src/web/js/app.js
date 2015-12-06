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
 * REST API client
 */
(function($, undefined) {
   var defaults = {
      baseUrl: "/api",
      username: null,
      password: null,
      headers: {
        "Content-Type": "application/json" 
      }
   };

   /*
    * Simple REST API plugin.
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
    * 
    * If you are using https and base64 encoding and basic authorization use this like so. 
    * This needs js/lib/base64.min.js included in your index.html
    * 
    * var Api = $.Api({
    *    baseUrl: url,
    *    headers: {
    *       Authorization: 'Basic ' + Base64.encode(uname + ":" + pass),
    *       "Content-Type": "application/json"
    *    }
    * });
    * </code>
    */
   $.Api = function(options) {
      var forEach = $.forEach,
              isArray = $.isArray,
              getTypeOf = $.getTypeOf,
              opts = $.shallowCopy({}, defaults, options),
              noop = function() {},
              onLine = ("online" in navigator) ? navigator.onLine : true,
              ret = {};
      
      function gotOnline() {
         onLine = true;
      }
      
      function gotOffline() {
         onLine = false;
      }
      
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
         if(!onLine) {
            console.log("Application is offline.");
            return;
         }
         
         var apiMethod = opts.baseUrl + (options.apiMethod || ""), 
                 reqData, headers = $.shallowCopy({}, opts.headers, options.headers);
         
         // console.log("Calling API method " + apiMethod);
         
         if(options.data) {
            if(method === "GET") {
               reqData = options.data;
            }else if(method === "DELETE") {
               reqData = null;
            }else {
               var ct = headers["Content-Type"];
               if(ct === "application/x-www-form-urlencoded") {
                  if(typeof options.data === "string") {
                     reqData = options.data;
                  }else {
                     var postData = [];
                     asParams(null, options.data, postData);
                     reqData = postData.join("&");
                  }
               }else {
                  if(!ct) {
                     headers["Content-Type"] = "application/json";
                  }
                  reqData = JSON.stringify(options.data);
               }
            }
         }
         
         if(options.timestamp !== false) {
            apiMethod += "?" + new Date().getTime();
         }
         
         $.ajax({
            url: apiMethod,
            method: method,
            username: opts.username,
            password: opts.password,
            data: reqData,
            headers: headers,
            dataType: options.dataType || "json",
            success: function(data, xhr) {
               // console.log(["SUCCESS", "method", apiMethod, JSON.stringify(data)].join(" ");
               (options.success || noop)(data, xhr);
            },
            error: function(code, xhr) {
               // console.log(["ERROR", "method", apiMethod, JSON.stringify(code)].join(" "));
               // doc.dispatch("apierror", {api: options.apiMethod, data: code});
               (options.failure || noop)(code, xhr);
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
      
      
      ret.option = function(name, value) {
         if(arguments.length === 1) {
            return opts[name];
         }else {
            opts[name] = value;
         }
      };
      
      
      ret.getBaseUrl = function() {
         return opts.baseUrl;
      };
      
      $(window).on("offline", gotOffline).on("online", gotOnline);
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
   var Events = $.EventTypes,
         doc = $(document),
         App = $.Application();
      
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
            var body = $(document.body);
            if(body.hasClass("reveal-appmenu")) {
               body.removeClass("reveal-appmenu");
            }else {
               body.addClass("reveal-appmenu");
            }
         }
      };

      $.extension("actionbar", function(acts) {
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
    
   
   

   
   
   
   window.Events = Events;
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
      
      
      // global menu ------------------------------------------------------------------
      
      var menuData = [
            {
               label: "Settings", 
               icon: "icon-cog", 
               action: function() {
                  Messages.info("View settings");
               }
            },
            {
               label: "Logout",
               icon: "icon-logout",
               action: function() {
                  if(window.confirm("Logout?")) {
                     window.location.replace("index.html");
                  }
               }
            }
         ],

         appMenu = $("#appMenu").datalist({
            itemClass: "activable", 
            selectable: false,
            template: $.template('<span class="{icon}"> {label}</span>'),
            data: menuData
         });

      appMenu.on(Events.tap, function(e, item, itemData) {
         if(itemData.action) {
            itemData.action(itemData);
         }
      });

      // initialize our app
      App.initialize({
         viewPort: vPort, 
         loadFromPath: false
         // , enableHashChange: false
      });
      
      App.loadView("views/tabs.html", "/tabs");
   });
   
})(window, h5);