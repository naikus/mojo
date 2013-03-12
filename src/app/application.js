"use strict";
(function($) {
   var div = document.createElement("div"),
      style = div.style,
      prefixes = ["", "Webkit", "Moz", "O", "ms", "MS"],

      props = {},
      
      tests = {
         transition: function() {
            var support, 
               transitionend = [
                  "transitionend", "webkitTransitionEnd", "transitionend", 
                  "oTransitionEnd", "MSTransitionEnd"
               ];
            
            for(var i = 0, len = prefixes.length; i < len; i++) {
               var pfx = prefixes[i], pt = pfx + "Transition";
               if(typeof style[pt] !== "undefined") {
                  support = true;
                  props.transition = pt;
                  props.transitionend = transitionend[i];
                  return pt;
               }
            }
            
            if(!support) {
               props.transition = null;
               props.transitionend =  null;
               return null;
            }
         },
         
         transform: function() {
            var support;
            
            for(var i = 0, len = prefixes.length; i < len; i++) {
               var pfx = prefixes[i], pt = pfx + "Transform";
               if(typeof style[pt] !== "undefined") {
                  support = true;
                  props.transform = pt;
                  return pt;
               }
            }
            if(!support) {
               props.transform = null;
               return null;
            }
         },
         
         hashchange: function() {
            props.hashchange = ("onhashchange" in window) ? "onhashchange" : null;
            return props.hashchange;
         }
      };
      
      $.Env = {
         _prefixes: prefixes,
         testElement: div,
         
         property: function(name, val) {
            if(arguments.length === 2) {
               props[name] = val;
               return val;
            }else {
               if(name in props) {
                  // console.log("Getting existing property: " + name);
                  return props[name];
               }else {
                  // console.log("Testing property: " + name);
                  var test = tests[name], val;
                  if(typeof test === "function") {
                     val = test.call(this);
                     props[name] = val;
                  }
                  return val;
               }
            }
         },
         
         addTest: function(name, testFunc, bForce) {
            if(! tests[name] || bForce) {
               tests[name] = testFunc;
            }
         }
      };      
})(h5);



"use strict";
(function($) {
   var paramPattern = /:([\w\.-]+)/g;
   
   function compile(patternUri) {
      var match = paramPattern.exec(patternUri), paramNames = [], allParts = [],
            cursor = 0, strTmp;
      while(match) {
         strTmp = patternUri.substring(cursor, match.index);
         if(strTmp) {
            allParts.push(strTmp);
         }
         allParts.push(match);
         paramNames.push(match[1]);
         
         // continue matching further
         cursor = paramPattern.lastIndex;
         match = paramPattern.exec(patternUri);
      }
      
      // if there's a trailing 'string' without params, append it.
      if(cursor < patternUri.length) {
         allParts.push(patternUri.substring(cursor));
      }
      
      // The expander function, given a parameter map, expand a uri template
      // into a URI
      function expander(paramMap) {
         var url = [];
         for(var i = 0, len = allParts.length; i < len; i++) {
            var part = allParts[i], param;
            if(typeof part === "string") {
               url.push(part);
            }else { // this is a param (a match result object)
               url.push(paramMap[part[1]] || (part[0] + "?"));
            }
         }
         return url.join("");
      }
      
      expander.paramNames = paramNames;
      return expander;
   }
   
   function UriTemplate(uriPattern) {
      var uriPattern = uriPattern,
            genPattern = new RegExp("^" + uriPattern.replace(paramPattern, "(.*[^/])") + "$"),
            expander = compile(uriPattern),
            paramNames = expander.paramNames;
      
      // console.log(genPattern + "\n" + paramNames);
      return {
         uri: uriPattern,
         paramNames: paramNames,
         
         matches: function(uri) {
            return genPattern.test(uri);
         },
         
         match: function(uri) {
            var res = genPattern.exec(uri), params = {};
            if(res) {
               for(var i = 0, len = paramNames.length; i < len; i++) {
                  params[paramNames[i]] = res[i+1];
               }
               return params;
            }
            throw new Error(uriPattern + " does not match " + uri);
         },
         
         expand: function(paramMap) {
            return expander(paramMap);
         },
         
         toString: function() {
            return uriPattern;
         }
      };
   }
   
   $.UriTemplate = UriTemplate;
})(h5);


"use strict";
(function($) {
   var Env = $.Env,
      hasTransition = !!(Env.property("transition")),
      transitionEndEvent = Env.property("transitionend"),
      hasHashchange = Env.property("hashchange");
      
   $.Application = function() {
      var noop = function() {},
      controllerMethods = ["initialize", "activate", "update", "deactivate", "destroy"],
      
      routes = [],
      stack = [],
      
      application,
      
      viewPort;
      
      // ------------------------------ Private Methods ------------------------

      function ensureLifecycle(controller) {
         $.forEach(controllerMethods, function(m) {
            var method = controller[m];
            if(!method) {
               controller[m] = noop;
            }
         });
      }

      function getPath(url) {
         var href = url || window.location.href, hashIdx = href.indexOf("#"), path = ""; 
         if(hashIdx !== -1) {
            path = href.substring(hashIdx + 1);
         }
         return path;
      }

      /**
       * Adds/registers a route with the application. These are currently view or overlay routes
       * @param {String} path The path for which this route's view is shown
       * @param {type} routeOpts The route options
       * @returns {undefined}
       */
      function addRoute(path, routeOpts) {
         console.log("Adding route: " + path);
         
         var route = $.extend({}, routeOpts);
         route.routeTemplate = $.UriTemplate(path);
         route.path = path;
         // add this route to the top, latest added routes get preferences over the older ones
         routes.unshift(route);
      }

      /**
       * Gets the route by its pattern path with with it was regisgtered
       * @param {String} path
       * @returns {Object} Route
       */
      function getRouteByPath(path) {
         var route;
         for(var i = 0, len = routes.length; i < len; i++) {
            route = routes[i];
            if(route.path === path) {
               return route;
            }
         }
         return null;
      }

      /**
       * Finds the first matching route for the given URL
       * @param {String} url
       * @returns {Object} Route
       */
      function getMatchingRoute(url) {
         var route;
         for(var i = 0, len = routes.length; i < len; i++) {
            route = routes[i];
            if(route.routeTemplate.matches(url)) {
               return route;
            }
         }
         return null;
      }

      function initializeRoute(route) {
         if(!route.view && !!route.overlay) {
            // what to do here??
            return;
         }

         var ui = route.ui = $(route.view || route.overlay);
         if(!ui.count()) {
            throw new Error("UI for view or overlay route not found: " + route.path);
         }

         // store the path on UI object so that we can retrieve routes when we handle events
         ui.data("path", route.path);

         ui.on(transitionEndEvent, route.overlay ? handleOverlayTransitionEnd : handleViewTransitionEnd);
         route.controller = route.factory(application, ui);
         ensureLifecycle(route.controller);
      }

      function pushView(path, route, params) {
         var route = getMatchingRoute(path), params, controller, ui;
         if(!route) {
            console.log("Unrecognized route: " + path);
            return;
         }
         
         // console.log("Pushing view: " + route.path);

         params = route.routeTemplate.match(path);
         ui = route.ui; 
         controller = route.controller;

         // see if this view is initialized (one time only)
         if(route.view && !route.ui) {
            // initialize the route crating any controllers by calling factories and calling controller's
            // initialize method
            initializeRoute(route);

            // init the controller
            ui = route.ui;
            controller = route.controller;

            ui.addClass("showing");
            controller.initialize(params);
         }


         // check if this view was earlier stacked because some other view was shown over it.
         if(ui.hasClass("stack")) {
            ui.removeClass("transition").removeClass("stack");
         }

         // activate the controller
         ui.addClass("showing");
         controller.activate(params);
         
         var currRoute = stack.length ? stack[stack.length - 1] : null;
         
         setTimeout(function() {
            // transitiion the current view out
            if(currRoute) {
               // do it only of new route is a view, e.g in case of overlays you don't need to transition views
               if(route.view) { 
                  currRoute.controller.deactivate();
                  stackViewUi(currRoute.ui);
               }
            }
            // transition in the new view
            pushViewUi(ui);
         }, 100);

         stack.push(route);
      }

      function popView(path, route, params) {
         var len = stack.length;

         // no routes on stack
         if(len <= 1) {
            console.log("Can't pop view, last in stack.");
            return;
         }

         var currRoute = stack.pop(), ui;
            
         params = params || route.routeTemplate.match(path);
         ui = route.ui;
         // if its in the history and not stacked, stack it first
         if(!ui.hasClass("stack") && !ui.hasClass("transition")) {
            ui.addClass("stack").addClass("transition");
         }
         route.controller.activate(params);
         ui.addClass("showing");

         setTimeout(function() {
            currRoute.controller.deactivate();
            popViewUi(currRoute.ui);
            unstackViewUi(route.ui);
         }, 100);
      }


      // UI Transitioning CSS class changes -------------------------------------------------------------

      function unstackViewUi(ui) {
         ui.addClass("transitioning").removeClass("stack").addClass("in");
         if(!hasTransition) {
            ui.dispatch("transitionend", {propertyName: "transform"});
         }
      }

      function popViewUi(ui) {
         ui.addClass("transitioning").removeClass("in").addClass("pop");
         if(!hasTransition) {
            ui.dispatch("transitionend", {propertyName: "transform"}); 
         }
      }

      function stackViewUi(ui) {
         ui.addClass("transitioning").addClass("stack").removeClass("in");
         // fire the view transition events manually if not supported
         if(!hasTransition) {
            ui.dispatch("transitionend", {propertyName: "transform"}); 
         }
      }

      function pushViewUi(ui) {
         ui.addClass("transitioning").addClass("transition").addClass("in");
         if(!hasTransition) {
            ui.dispatch("transitionend", {propertyName: "transform"});
         }
      }

      // ------------------------------------------------------------------------------------------------

      function handleOverlayTransitionEnd(evt) {
      }

      function handleViewTransitionEnd(evt) {
         var target = evt.target, ui = $(target), route = getRouteByPath(ui.data("path"));

         ui.removeClass("transitioning");

         // if ui has transitioned to stacked, deactivate it
         if(ui.hasClass("stack")) {
            ui.removeClass("showing");
            dispatchViewTransitionEvent("out", ui, route);
            return;
         }

         // if ui has transitioned in
         if(ui.hasClass("in")) {
            dispatchViewTransitionEvent("in", ui, route);
            return;
         }

         // if view has been popped
         if(ui.hasClass("pop")) {
            ui.removeClass("showing").removeClass("transition").removeClass("pop");
            dispatchViewTransitionEvent("out", ui, route);
         }
      }
      
      function dispatchViewTransitionEvent(tType, ui, route) {
         viewPort.dispatch("viewtransition" + tType, {
            path: route.path,
            bubbles: false,
            cancelable: true
         });

         ui.dispatch("transition" + tType, {
            path: route.path,
            bubbles: false
         });
      }

      
      // var oPath, nPath;
      function RouteHandler(e, path, params) {
         if(!RouteHandler.isActive()) {
            console.log("Not active, ignoring hashchange");
            return;
         }
         var route, currRoute, nPath = path || getPath();
         
         console.log("Calling route handler: " + nPath);

         // console.log(e);
         // console.log("handleRoute: getting mathing route for: " + nPath);
         route = getMatchingRoute(nPath);
         
         if(!route) {
            console.log("No matching route, doing nothing");
            return;
         }
         currRoute = stack[stack.length - 1];

         // same route handler probably params are different, so update
         if(currRoute === route) {
            route.controller.update(route.routeTemplate.match(nPath));
         }else {
            // either front or back or hyperlink is clicked
            if(route === stack[stack.length - 2]) {
               popView(nPath, route, params);
            }else {
               pushView(nPath, route, params);
            }
         }
      }
      RouteHandler.isActive = function() {
         return !this.inactive;
      };
      RouteHandler.activate = function() {
         this.inactive = false;
      };
      RouteHandler.deactivate = function() {
         this.inactive = true;
      };
      
      $(window).on("hashchange", RouteHandler);

      // ---------------------------- Application API --------------------------
      application = {
         addRoute: addRoute,

         route: function(path, params) {
            RouteHandler.deactivate();
            window.location.hash = path;
            RouteHandler(null, path, params);
            RouteHandler.activate();
         },
                 
         back: function(result) {
            RouteHandler.deactivate();
            window.history.back();
            RouteHandler(null, getPath(), result);
            RouteHandler.activate();
         },
                 
         /**
          * Loads a remote view (in a different file) inside the view port and calls the specified
          * callback after the view is loaded
          * Experimental!!!
          * @param {String} templateUrl The url of the html template that will reigster new routes (one or more)
          * @param {Function} callback The callback function to call if the view loads successfully
          */
         load: function(templateUrl, callback) {
            $.xhr({
               url: templateUrl, 
               method: "GET", 
               dataType: "text", 
               success: function(content) {
                  var html = $(content), scripts = html.find("script"), 
                          exeScripts = [], code = [], finalScript;
                  scripts.forEach(function(script) {
                     var scr = $(script), type = scr.attr("type");
                     if(!scr.attr("src") && (!type || type.indexOf("/javascript") !== -1)) {
                        html.remove(script);
                        exeScripts[exeScripts.length] = script;
                     }
                  });
                  
                  
                  viewPort.append(html);
                  
                  forEach(exeScripts, function(script) {
                     code[code.length] = script.textContent;
                  });
                  
                  finalScript = document.createElement("script");
                  finalScript.textContent = code.join('\n');
                  html.append(finalScript);
                  
                  if(callback) {
                     callback(templateUrl);
                  }
               }
            });
         },

         getViewPort: function() {
            return viewPort;
         },

         initialize: function(options) {
            viewPort = options.viewPort;
            RouteHandler();
         }
      };
      
      return application;
   };
    
})(h5);
