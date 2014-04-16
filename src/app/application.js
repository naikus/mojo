/*globals window, document, h5, console */
//"use strict"; // jshint ignore:line
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
                  var test = tests[name], value;
                  if(typeof test === "function") {
                     value = test.call(this);
                     props[name] = value;
                  }
                  return value;
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



(function($) {
   // var paramPattern = /:([\w\.-]+)/g;
   
   function compile(patternUri, paramPattern) {
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
   
   function UriTemplate(uriPtrn) {
      var paramPattern = /:([\w\.-]+)/g, 
            uriPattern = uriPtrn,
            
            // the order of these two lines is important, in IE8, otherwise the paramPattern.exec will return null
            expander = compile(uriPattern, paramPattern),
            genPattern = new RegExp("^" + uriPattern.replace(paramPattern, "([^/]*)") + "$"),
            
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



(function($, window) {
   var Env = $.Env,
      hasTransition = !!(Env.property("transition")),
      transitionEndEvent = Env.property("transitionend") || "transitionend",
      hasHashchange = Env.property("hashchange");
      
   $.Application = function() {
      var noop = function() {},
      controllerMethods = ["initialize", "activate", "update", "deactivate", "destroy"],

      routeConfigs = [],
      routes = [],
      stack = [],
      
      application,
      
      setTimeout = window.setTimeout,
      
      transitionProp, // the transition property that we are tracking (e.g. transform, opacity, position, etc.)
      
      useHash = true,
      
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
       * Adds/registers a route with the application. These are currently view routes
       * @param {String} path The path for which this route's view is shown
       * @param {type} routeOpts The route options
       * @returns {undefined}
       */
      function addRoute(path, routeOpts) {
         var route = $.shallowCopy({}, routeOpts);
         route.pathTemplate = $.UriTemplate(path);
         route.path = path;
         
         console.log("Adding route:" + path);
         // add this route to the top, latest added routes get preferences over the older ones
         routes.unshift(route);
      }
      
      function addRouteConfig(cfg) {
         console.log("Adding route config: " + cfg.path);
         routeConfigs.unshift({
            pathTemplate: $.UriTemplate(cfg.path),
            viewPath: cfg.viewPath
         });
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
       * @param {Array} arrRoutesOrCfg An array of routes or routeconfigs
       * @returns {Object} Route or routeconfig 
       */
      function getMatching(url, arrRoutesOrCfg) {
         var match;
         for(var i = 0, len = arrRoutesOrCfg.length; i < len; i++) {
            match = arrRoutesOrCfg[i];
            if(match.pathTemplate.matches(url)) {
               return match;
            }
         }
         return null;
      }
      
      function getRouteOnStack(path) {
         for(var i = 0, len = stack.length; i < len; i++) {
            if(path === stack[i].path) {
               return stack[i];
            }
         }
         return null;
      }

      function prepareRoute(route) {
         if(!route.id) {
            throw new Error("Please provide the route id, a selector that is the view UI.");
         }

         var ui = route.ui = $("#" + route.id);
         if(!ui.count()) {
            throw new Error("UI for route not found: " + route.path);
         }

         // store the path on UI object so that we can retrieve routes when we handle events
         ui.data("path", route.path);

         ui.on(transitionEndEvent, handleViewTransitionEnd);
         route.controller = route.factory(application, ui);
         ensureLifecycle(route.controller);
      }

      function pushView(path, data, resultCallback, optRoute) {
         var controller, ui, route = optRoute || getMatching(path, routes), params;
         
         if(!route) {
            console.log("Unrecognized route: " + path);
            return;
         }
         
         params = route.pathTemplate.match(path);
         ui = route.ui; 
         controller = route.controller;
         
         // see if this view is initialized (one time only)
         if(!route.ui) {
            // initialize the route crating any controllers by calling factories and initializing controllers
            prepareRoute(route);

            // init the controller
            ui = route.ui;
            controller = route.controller;

            ui.addClass("showing"); // this is needed if the controller wants to get some DOM values
                                    // such as offsets etc.
            controller.initialize(params, data);
         }
         
         // see if this is an update
         var currRoute = stack.length ? stack[stack.length - 1] : null;
         
         if(currRoute === route) {
             if(currRoute.realPath !== path) {
                 currRoute.realPath = path;
                 controller.update(params);
             }
             return;
         }
         
         // set this path as route's current path
         route.realPath = path;

         // check if this view was earlier stacked because some other view was shown over it.
         if(ui.hasClass("stack")) {
            ui.removeClass("transition").removeClass("stack");
         }

         ui.addClass("showing");
         
         if(currRoute) {
            // called when the view shown is popped, to pass data to the calling view
            currRoute.onresult = resultCallback;
         }
         // indicate that both views are transitioning
         viewPort.addClass("view-transitioning");
         
         setTimeout(function() {
             controller.activate(params, data);
             
            // transitiion the current view out
            if(currRoute) {
               currRoute.controller.deactivate();
               stackViewUi(currRoute.ui);
            }
            // transition in the new view
            pushViewUi(ui);
         }, 50);

         stack.push(route);
      }

      function popView(data, toPath) {
         var route, currRoute, path, ui, params, resultCallback;

         // no routes on stack
         if(stack.length <= 1) {
            console.log("Can't pop view, last in stack.");
            return;
         }

         currRoute = stack.pop();
         
         if(toPath) {
            route = getRouteOnStack(toPath);
            if(route) {
               while(route !== stack[stack.length - 1]) {
                  stack.pop();
               }
               // route = stack[stack.length - 1];
            }else {
               throw new Error("Route " + route.path + " is not on stack");
            }
         }else {
            route = stack[stack.length - 1];
         }
         
         resultCallback = route.onresult;
         path = route.realPath;
            
         params = route.pathTemplate.match(path);
         ui = route.ui;
         
         // if its in the history and not stacked, stack it first
         if(!ui.hasClass("stack") && !ui.hasClass("transition")) {
            ui.addClass("stack").addClass("transition");
         }

         // indicate that this view is transitioning
         viewPort.addClass("view-transitioning");
         
         if(typeof resultCallback === "function") {
            resultCallback(data);
            route.onresult = null;
         }
         
         // make this view visible
         ui.addClass("showing");
        
         setTimeout(function() {
            route.controller.activate(params, data);
            currRoute.controller.deactivate();
            popViewUi(currRoute.ui);
            unstackViewUi(route.ui);
         }, 50);
      }
        
        
      /**
       * Loads a remote view (in a different file) inside the view port and calls the specified
       * callback after the view is loaded
       * Experimental!!!
       * @param {String} templateUrl The url of the html template that will reigster new routes (one or more)
       * @param {Function} callback The callback function to call if the view loads successfully
       */
      function loader(templateUrl, callback) {
         var cache = loader.templateCache = loader.templateCache || {};
          
         if(cache[templateUrl]) {
             // console.log("Template already loaded: " + templateUrl);
             callback(templateUrl);
             return;
         }
      
         $.xhr({
            url: templateUrl, 
            method: "GET", 
            dataType: "html", 
            success: function(content) {
               cache[templateUrl] = true;
               
               var div = $(document.createElement("div")),
                       html = $(content),
                       scripts = html.find("script"), 
                       allScripts = [], inlineCode = [], 
                       
                       script, scriptSource, extScriptCount = 0, externalScripts,
                       done = function() {
                          var inlineScript = document.createElement("script");
                          inlineScript.textContent = inlineCode.join('\n');
                          div.append(inlineScript);

                          if(callback) {
                             callback(templateUrl);
                          }
                       },
                       scriptLoaded = function() {
                          extScriptCount -= 1;
                          if(extScriptCount === 0) {
                             done();
                          }
                       },
                       callLoaded = function() {
                           if(this.readyState === "loaded" || this.readyState === "complete") {
                              scriptLoaded();
                           }
                       };
      
               scripts.forEach(function(scriptElem) {
                  var scr = $(scriptElem), type = scr.attr("type"), source;
                  
                  if((source = scr.attr("src"))) {
                     externalScripts = true;
                     extScriptCount += 1;
                  }
                  
                  if(!type || type.indexOf("/javascript") !== -1) {
                     html.remove(scriptElem);
                     allScripts[allScripts.length] = scr;
                  }
               });
      
               div.addClass("remote");
               div.attr("data-id", templateUrl);
               div.append(html);
      
               viewPort.append(div);
      
               for(var i = 0, len = allScripts.length; i < len; i++) {
                  script = allScripts[i];
                  if((scriptSource = script.attr("src"))) { // jshint ignore:line
                     script = document.createElement("script");
                     if("onreadystatechange" in script) {
                        script.onreadystatechange = callLoaded;
                     }else {
                        script.onload = scriptLoaded;
                     }
                     script.src= scriptSource;
                     script.async = 1;
                     div.append(script);
                  }else {
                     inlineCode[inlineCode.length] = script.get(0).textContent;
                  }
               }
               
               if(!externalScripts && callback) {
                  done();
               } 
            }
         });
      }
      

      // UI Transitioning CSS class changes -------------------------------------------------------------

      function unstackViewUi(ui) {
         // dispatchBeforeViewTransitionEvent("in", ui, getRouteByPath(ui.data("path")));
         
         ui.removeClass("stack").addClass("in");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      function popViewUi(ui) {
         // dispatchBeforeViewTransitionEvent("out", ui, getRouteByPath(ui.data("path")));

         ui.removeClass("in").addClass("pop");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      function stackViewUi(ui) {
         // dispatchBeforeViewTransitionEvent("out", ui, getRouteByPath(ui.data("path")));
         
         ui.addClass("stack").removeClass("in");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      function pushViewUi(ui) {
         // dispatchBeforeViewTransitionEvent("in", ui, getRouteByPath(ui.data("path")));
         
         ui.addClass("transition").addClass("in");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      // ------------------------------------------------------------------------------------------------

      function handleViewTransitionEnd(evt) {
         var target = evt.target, ui = $(target), route = getRouteByPath(ui.data("path"));
         
         if(!route || (transitionProp !== null && evt.propertyName.indexOf(transitionProp) === -1)) {
            return; // not a view or not a 'transitionProp' transition on this view.
         }

         // if ui has transitioned to stacked, deactivate it
         if(ui.hasClass("stack")) {
            // route.controller.deactivate();
            ui.removeClass("showing");
            viewPort.removeClass("view-transitioning"); // this is called after removing 'showing' class
            
            // rendering performance
            setTimeout(function() {
               dispatchViewTransitionEvent("out", ui, route);
            }, 50);
            
         }else if(ui.hasClass("in")) {// if ui has transitioned in
            viewPort.removeClass("view-transitioning");
            
            setTimeout(function() {
               dispatchViewTransitionEvent("in", ui, route);
            }, 50);
            
         }else if(ui.hasClass("pop")) { // if view has been popped
            // route.controller.deactivate();
            ui.removeClass("showing").removeClass("transition").removeClass("pop");
            viewPort.removeClass("view-transitioning");
            
            setTimeout(function() {
               dispatchViewTransitionEvent("out", ui, route);
            }, 50);
         }
      }
      
      function dispatchViewTransitionEvent(tType, ui, route) {
         viewPort.dispatch("viewtransition" + tType, {
            path: route.path,
            bubbles: false,
            cancelable: false
         });

         ui.dispatch("transition" + tType, {
            path: route.path,
            bubbles: false,
            cancelable: false
         });
      }
      
      function dispatchBeforeViewTransitionEvent(tType, ui, route) {
         viewPort.dispatch("beforeviewtransition" + tType, {
            path: route.path,
            bubbles: false,
            cancelable: true
         });

         ui.dispatch("beforetransition" + tType, {
            path: route.path,
            bubbles: false
         });
      }

      
      // var oPath, nPath;
      function RouteHandler(e) {
         if(e && RouteHandler.ignoreNext) {
            RouteHandler.ignoreNext = false;
            console.log("RouteHandler: Ignoring hashchange this time");
            return;
         }
     
         var nPath = getPath(), route = getMatching(nPath, routes);
         if(!route) {
            // check if configured
            var cfg = getMatching(nPath, routeConfigs);
            if(!cfg) {
               throw new Error("View not found at " + nPath);
            }
            loader(cfg.viewPath, function() {
               RouteHandler.processView(nPath);
            });
         }else {
            RouteHandler.processView(nPath, route);
         }
         
      }
      RouteHandler.ignoreNextHashChange = function() {
         this.ignoreNext = true;
      };
      RouteHandler.processView = function(path, route) {
         var currRoute = stack[stack.length - 1], params;
         route = route || getMatching(path, routes);
         params = route.pathTemplate.match(path);

         // same route handler probably params are different, so update
         if(currRoute === route) {
             if(currRoute.realPath !== path) {
                 currRoute.realPath = path;
                 route.controller.update(params);
             }
         }else {
            // either front or back or hyperlink is clicked
            if(route === stack[stack.length - 2]) {
               popView(null);
            }else {
               pushView(path, null, null, route);
            }
         }         
      };

      
      
      // ---------------------------- Application API --------------------------
      application = {
         addRoute: addRoute,

         showView: function(path, data, resultCallback) {
            // console.log(path + ", " + window.location.hash);
            // path check is because we may also load from <a href="#/somepath"></a>
            if(useHash && ("#" + path !== window.location.hash)) {
               RouteHandler.ignoreNextHashChange();
               window.location.hash = path;
            }
            
            var route = getMatching(path, routes);
            if(!route) {
               // check if configured
               var cfg = getMatching(path, routeConfigs);
               if(!cfg) {
                  throw new Error("View not found at " + path);
               }
               
               loader(cfg.viewPath, function() {
                  pushView(path, data, resultCallback);
               });
            }else {
               pushView(path, data, resultCallback, route);
            }
         },
                 
         popView: function(result, toPath) {
            var len = stack.length;
            if(len >= 2) {
                var route = toPath ? getRouteOnStack(toPath) : stack[len - 2];
                if(route) {
                    if(useHash) {
                       RouteHandler.ignoreNextHashChange();
                       window.location.hash = route.realPath;
                    }
                }
                popView(result, toPath);
            }
         },
                 
         getCurrentRoute: function() {
            var route = stack.length ? stack[stack.length - 1] : null;
            if(route) {
               return {
                  id: route.id,
                  path: route.path,
                  realPath: route.realPath,
                  controller: route.controller
               };
            }
            return null;
         },
         
         loadView: function(viewTemplateUrl, path, data, resultCallback) {
            var route = getMatching(path, routes), app = this;
            if(!route) {
                loader(viewTemplateUrl, function() {
                    app.showView(path, data, resultCallback);
                });
            }else {
                this.showView(path, data, resultCallback);
            }
         },
                 
         getViewPort: function() {
            return viewPort;
         },

         initialize: function(options) {
            viewPort = options.viewPort;
            transitionProp = "transitionProperty" in options ? options.transitionProperty : "transform";
            useHash = (options.enableHashChange !== false);            
            
            $.forEach(options.routes || [], function(cfg) {
               addRouteConfig(cfg);
            });
            
            var path;
            if(options.loadFromPath !== false) {
               path = getPath();
            }
            
            path = path || options.startView;
            if(path) {
               this.showView(path);
            }

            if(useHash) {
               $(window).on("hashchange", RouteHandler);
            }
         }
      };
      
      $(window).on("unload", function() {
         $.forEach(routes, function(r) {
            try {
               r.controller.destroy();
            }catch(ignore) {}
         });
      });
      
      return application;
   };
    
})(h5, window);



