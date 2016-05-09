/*!
 * The MIT License
 * 
 * Copyright (c) 2011-2013 mojo Authors. All rights reserved.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
 
 

/* global window, document, h5, console */
//"use strict"; // jshint ignore:line

/*
 * A generic event helper that other components can use to support eventing
 * It manages registering unregistering of handlers and dispatching events to
 * handlers
 */
(function($, undefined) {
  $.eventHelper = function() {
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
  window.requestAnimationFrame = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(cb) {
        return window.setTimeout(cb, 1000 / 60);
      };
})(h5);


/*
 * Tests for various browser properties support, out of the box supported are
 * those that are required by the application framework:
 * transition, transform, hashchange
 */
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
            props.transitionend = null;
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
      if(!tests[name] || bForce) {
        tests[name] = testFunc;
      }
    }
  };
})(h5);


/*
 * A URI template that can be used to match URS with parameter substitution
 * e.g. Given a URI template: 
 * <pre>
 * 
 * var t = $.UriTemplate("/catlogue/:catId/product/:prodId/name");
 * t.matches("/catalogue/1/product/23/name"); // will return true
 * t.match("/catalogue/1/product/23/name"); // returns {catId: "1", prodId: "23"}
 * t.expand({catId: 2, prodId: 40}); // will return "/catalogue/2/product/40/name"
 * 
 * </pre>
 */
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
            params[paramNames[i]] = res[i + 1];
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
        // the transition property that we are tracking (e.g. transform, opacity, position, etc.)
        transitionProp, 
        DEFAULT_TRANSITION_DELAY = 100,
        transitionDelay = DEFAULT_TRANSITION_DELAY,
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
        // ui.removeClass("transition").removeClass("stack");
        ui.removeClass("stack");
      }

      // Experimental!!!
      // appendView(ui);

      ui.addClass("showing");

      if(currRoute) {
        // called when the view shown is popped, to pass data to the calling view
        currRoute.onresult = resultCallback;
      }
      // indicate that both views are transitioning
      viewPort.addClass("view-transitioning");

      setTimeout(function() {
        if(currRoute) {
          currRoute.controller.deactivate();
        }
        controller.activate(params, data);

        // transitiion the current view out
        requestAnimationFrame(function() {
          if(currRoute) {
            stackViewUi(currRoute.ui);
          }
          // transition in the new view
          pushViewUi(ui);
        });
      }, transitionDelay);
      
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
      if(!ui.hasClass("stack")) {
        ui.addClass("stack");
      }

      // Experimental!!!
      // appendView(ui);

      // indicate that this view is transitioning
      viewPort.addClass("view-transitioning");

      if(typeof resultCallback === "function") {
        resultCallback(data);
        route.onresult = null;
      }

      // make this view visible
      ui.addClass("showing");

      setTimeout(function() {
        currRoute.controller.deactivate();
        route.controller.activate(params, data);
        
        requestAnimationFrame(function() {
          popViewUi(currRoute.ui);
          unstackViewUi(ui);
        });
      }, transitionDelay);
    }

    function appendView(ui) {
      // console.log("unstack Parent node");
      // console.log(ui.get(0).parentNode.parentNode);
      var viewElem = ui.get(0), viewParent = viewElem.parentNode, appendElem;
      if(viewParent === viewPort.get(0)) {
        appendElem = viewElem;
      }else if(viewParent.getAttribute("data-view-template")) {
        appendElem = viewParent;
      }

      if(appendElem) {
        viewPort.append(appendElem);
      }
    }

    function removeView(ui) {
      var viewElem = ui.get(0), viewParent = viewElem.parentNode, removeElem;
      if(viewParent === viewPort.get(0)) {
        removeElem = viewElem;
      }else if(viewParent.getAttribute("data-view-template")) {
        removeElem = viewParent;
      }
      viewPort.remove(removeElem);
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
          div.attr("data-view-template", templateUrl);
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
              script.src = scriptSource;
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
      dispatchBeforeViewTransitionEvent("in", ui, getRouteByPath(ui.data("path")));

      ui.removeClass("stack").addClass("in");
      if(!hasTransition || !transitionProp) {
        handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
      }
    }

    function popViewUi(ui) {
      dispatchBeforeViewTransitionEvent("out", ui, getRouteByPath(ui.data("path")));

      ui.removeClass("in").addClass("pop");
      if(!hasTransition || !transitionProp) {
        handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
      }
    }

    function stackViewUi(ui) {
      dispatchBeforeViewTransitionEvent("out", ui, getRouteByPath(ui.data("path")));

      ui.addClass("stack").removeClass("in");
      if(!hasTransition || !transitionProp) {
        handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
      }
    }

    function pushViewUi(ui) {
      dispatchBeforeViewTransitionEvent("in", ui, getRouteByPath(ui.data("path")));

      // ui.addClass("transition").addClass("in");
      ui.addClass("in");
      if(!hasTransition || !transitionProp) {
        handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
      }
    }

    // ------------------------------------------------------------------------------------------------

    function handleViewTransitionEnd(evt) {
      var target = evt.target, ui = $(target), route = getRouteByPath(ui.data("path")), eType;

      if(!route || (transitionProp !== null && evt.propertyName.indexOf(transitionProp) === -1)) {
        return; // not a view or not a 'transitionProp' transition on this view.
      }

      // if ui has transitioned to stacked, deactivate it
      if(ui.hasClass("stack")) {
        ui.removeClass("showing");
        eType = "out";
      }else if(ui.hasClass("in")) {// if ui has transitioned in
        eType = "in";
        viewPort.removeClass("view-transitioning");
      }else if(ui.hasClass("pop")) { // if view has been popped
        ui.removeClass("showing").removeClass("pop");
        eType = "out";
      }

      if(eType) {
        setTimeout(function() { // rendering performance
          dispatchViewTransitionEvent(eType, ui, route);
          // Experimental!!!
          /*
           if(eType === "out") {
           removeView(ui);
           }
           */
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
      if(!nPath) {
        console.log("Warning, no path specified using '/'");
        nPath = "/";
      }

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
        return route;
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
        transitionDelay = options.transitionDelay || DEFAULT_TRANSITION_DELAY;

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




/*
 * Simple data binder 
 */
;(function($) {
   var forEach = $.forEach, 
      getTypeOf = $.getTypeOf,
      binders;

   function setContentStandard(arrElems, value) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].textContent = value;
      }
   }
   
   function setContentIE(arrElems, value) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].innerText = value;
      }
   }
   
   function getKey(theKey) {
      var idx = theKey.indexOf(":"), type, key;
      if(idx === -1) {
         type = "text";
         key = theKey;
      }else {
         type = theKey.substring(0, idx);
         key = theKey.substring(idx + 1);
      }
      // console.log(type + ", " + key);
      return {
         type: type,
         key: key
      };
   }
   
   function getValue(key, obj, formatter) {
      var i, len, val, keys = key.split("."), tmp = obj, par;
      for(i = 0, len = keys.length; i < len; i++) {
         par = tmp;
         val = tmp[keys[i]];
         if(val == null) { // intentional '==' to check for null and undefined
            break;
         }else {
            tmp = val;
         }
      }
      if(!val && i < len) { // this means some object in the chain is null and we still have keys left
         return formatter ? formatter(val) : "";
      }
      val = val || tmp;
      if(typeof val === "function") {
         val = val.call(par);
      }
      return formatter ? formatter(val) : val;
   }

   
   binders = {
      attr: function(arrElems, value, attr) {
         for(var i = 0, len = arrElems.length; i < len; i++) {
            arrElems[i].setAttribute(attr, value);
         }
      },
      
      value: function(arrElems, value) {
         for(var i = 0, len = arrElems.length; i < len; i++) {
            var elem = $(arrElems[i]);
            if(elem.val() !== value) {
               elem.val(value);
            }
         }
      },
      
      // use appropriate function for textContent
      text: ("textContent" in document.documentElement ? setContentStandard : setContentIE),
      
      html: function(arrElems, value) {
         for(var i = 0, len = arrElems.length; i < len; i++) {
            arrElems[i].innerHTML = value;
         }
      },
      
      cssclass: (function() {
        var actions = {
          add: function(elem, value) {
            elem.addClass(value);
          },
          remove: function(elem, value) {
            elem.removeClass(value);
          },
          set: function(elem, value) {
            elem.get(0).className = value;
          }
        };
        return function(arrElems, value, act) {
          var action = actions[act] || actions.set;
          for(var i = 0, len = arrElems.length; i < len; i++) {
            action($(arrElems[i]), value);
          }
        };
      })()
   };
   
   $.binder = {
      
   };
   
   $.extension("binder", function(options) {
      options = options || {};
      var model = options.model || {}, self = this, 
            bindingAttr = options.attr || "data-bind",
            boundElemMap = {}, 
            formatters = options.formatters || {},
            converters = options.converters || {};
      
      function applyBindings() {
         forEach(boundElemMap, function(keyMap, modelKey) {
            var value = getValue(modelKey, model, formatters[modelKey]);
            applyBindingsForKey(modelKey, value);
         });
      }
      
      function applyBindingsForKey(modelKey, value) {
         var keyMap = boundElemMap[modelKey] || {};
         forEach(keyMap, function(arrElems, typeKey) {
            var binderInfo = typeKey.split("@"), 
                binderName = binderInfo[0] || typeKey, 
                extra = binderInfo[1], 
                binder;
            
            console.log(binderName + "@" + extra + ":" + modelKey);
            binder = binders[typeKey] || binders.text;
            binder(arrElems, value, extra);
         });
         
         if($.getTypeOf(value) === "Object") {
            var k = modelKey + ".";
            $.forEach(value, function(val, prop) {
               applyBindingsForKey(k + prop, val);
            });
         }
      }

      /**
       * Partially updates the model from the specified model model
       * @param {type} mdl The values to update in this binder's model
       * @param {type} pKey Optional parent key (for nested keys e.g. user.name)
       * @param {type} modelRef Optoinal parent model
       * @returns {undefined}
       */
      function updateModel(mdl, pKey, modelRef) {
         if(!mdl) {return;}
         var parentKey = pKey ? pKey + "." : "", pModel = modelRef || model;
         forEach(mdl, function(value, key) {
            var actKey = parentKey + key, type = getTypeOf(value), formatter = formatters[actKey];
            if(type === "Object") {
               applyBindingsForKey(actKey, formatter ? formatter(value) : value);
               updateModel(value, key, pModel[key] || (pModel[key] = {}));
            }else {
               if(pModel[key] !== value) {
                  pModel[key] = value; //update our model
                  applyBindingsForKey(actKey,  formatter ? formatter(value) : value);
               }
            }
         });
      }

      function updateModelValue(key, value, updateView) {
         var keys = key.split("."), modelValue, partKey, tmpModel = model, 
             formatter = formatters[key];
     
         for(var i = 0, len = keys.length; i < len; i++) {
            partKey = keys[i];
            modelValue = tmpModel[partKey];
            if(i === len - 1) {
               // ?? This could be a problem
               // if(modelValue !== value) {
               tmpModel[partKey] = value;
               // }
            }else {
               if(!modelValue) {
                  tmpModel[partKey] = {};
               }
               tmpModel = tmpModel[partKey];
            }
         }
         
         // console.log(tmpModel == model);
         
         // update the view
         if(updateView) {
            applyBindingsForKey(key, formatter ? formatter(value) : value);
         }
      }
      
      function identity(arg) {return arg;}
      
      function changeListener(e) {
         var elem = e.target, 
               bindKey = elem.getAttribute(bindingAttr), 
               keyInfo = getKey(bindKey),
               converter = converters[keyInfo.key] || identity;
         updateModelValue(keyInfo.key, converter(elem.value));
      }
      
      function attachListeners(elem, key) {
         var eName = elem.nodeName.toLowerCase(), type = eName.type, el, val;
         if((eName === "input" || eName === "textarea" || eName === "select") && 
                 (type !== "submit" && type !== "reset" || type !== "image" && type !== "button")) {
            el = $(elem);
            el.on("input", changeListener).on("change", changeListener);
            // Read initial values from input controls?
            /*
            val = getValue(key);
            if(!val) {}
            */
         }
      }
      
      /* Structure of bound element map
      var boundElemMap = {
         "user.firstname": {
            "attr@title": [],
            "text": [],
            "html": []
         }
      };
      */
      // search for all bound elements
      self.find("[" + bindingAttr + "]").forEach(function(elem) {
         var bindKey = elem.getAttribute(bindingAttr), 
               keyInfo = getKey(bindKey),
               keyMap = boundElemMap[keyInfo.key] || (boundElemMap[keyInfo.key] = {}), 
               arrElems = keyMap[keyInfo.type] || (keyMap[keyInfo.type] = []);
               
         // console.log(boundElemMap);               
         arrElems[arrElems.length] = elem;
         
         attachListeners(elem, keyInfo.key);
      });
      
      applyBindings(model);
      
      return {
         apply: function(mdl) {
            model = mdl || {};
            applyBindings();
         },
         
         update: function(key, val, updateView) {
            if(typeof key === "string") {
               updateModelValue(key, val, updateView === false ? false : true);
            }else {
               updateModel(key); // key is actually a partial model object
            }
         },
         
         getModel: function() {
            return model;
         }
      };
      
   });
})(h5);


/**
 * A simple templating mechanism for creating string templates. A template has replacement tokens
 * that are of the format '{' followed by anystring followed by '}'. 
 * @example
 * var temp = $.template("Hi, my name is {firstName} {lastName}, born in {birthYear}. " + 
 *    "I live on the {address.street} street. Today I'm {getAge} years old.");
 * var out = temp.process({
 *    firstName: "John",
 *    lastName:  "Doe",
 *    birthYear: 1975,
 *    getAge: function() {
 *       return new Date().getYear() - this.birthYear;
 *    },
 *    address: {
 *       street: "1st"
 *    } 
 * });
 * 
 * // another way to create the template is:
 * <script id="nameTemplate" type="text/x-mojo-template">
 *    <p class="name">{firstName} {lastName}</p>
 *    <p class="address">{address.street}</p>
 * </script>
 * // in js file:
 * var templ = $("#nameTemplate").template();
 * var out = templ.process({
 *    firstName: "John",
 *    lastName:  "Doe",
 *    address: {
 *       street: "1st"
 *    } 
 * });
 * 
 * New Feature: An optional map of value functions aka formatters can also be passed to 
 * template extension.
 * 
 * This allows one to do two things:
 * 1. Format values as they are replaced in template
 * 2. Add arbitrary keys to template and provide value functions to compute values from other
 *    properties in the template's data object (thats passed to 'template.process')
 * 
 * var templ = $.template("Hi, my name is {firstname} and my full name is {fullName}", {
 *    firstName: function(val, obj) {
 *       return val ? capitalize(val) : "Mac"; // here 'val' is the value for obj["firstName"]
 *    },
 *    fullName: function(val, obj) {
 *       return obj.firstName + " " + obj.lastName;
 *    }
 * });
 * 
 * templ.process({
 *    firstName: "John",
 *    lastName:  "Doe",
 *    address: {
 *       street: "1st"
 *    } 
 * });
 * 
 * Notice 'fullName' property is not present in the object passed to template's process method
 * but
 * 
 * @author aniketn3@gmail.com
 */
(function($) {
   var regExp = /\{([^\{\}]+)\}/g;
   
   /** 
    * Internally compiles the template into a function so that we don't need to
    * search the string for replacement for every call to process() function
    */
   function compile(templateStr) {
      var match = regExp.exec(templateStr), allParts = [], tmp = templateStr, lastIndex = 0;
      while(match !== null)   {
         tmp = templateStr.substring(lastIndex, match.index);
         if(tmp) {
            allParts.push(tmp);
         }
         allParts.push({
            rawKey:match[0], 
            key: match[1]
         });
         lastIndex = regExp.lastIndex;
         match = regExp.exec(templateStr);
      }
      // if there is any trailing string
      if(lastIndex < templateStr.length) {
         allParts.push(templateStr.substring(lastIndex));
      }

      return function(objMap, valFuncs) {
         var str = [], i, len, part;
         if(!objMap) {
            return allParts.join("");
         }
         
         for(i = 0, len = allParts.length; i < len; i++)  {
            part = allParts[i];            
            if(typeof(part) === "string")   {
               str[str.length] = part;
            }else {
               str[str.length] = getValue(part.key, objMap, valFuncs[part.key]);
            }
         }
         return str.join("");
      };
   }
   
   function getValue(key, obj, valueFunc) {
      var i, len, val, keys = key.split("."), tmp = obj, par;
      for(i = 0, len = keys.length; i < len; i++) {
         par = tmp;
         val = tmp[keys[i]];
         if(val == null) { // intentional '==' to check for null and undefined
            break;
         }else {
            tmp = val;
         }
      }
      if(!val && i < len) { // this means some object in the chain is null and we still have keys left
         return valueFunc ? valueFunc(val, obj) : "";
      }
      val = val || tmp;
      if(typeof val === "function") {
         return valueFunc ? valueFunc(val.call(par), obj) : val.call(par, obj);
      }else {
         return valueFunc ? valueFunc(val, obj) : val;
      }
   }
   
   $.template = function(text, valFuncMap) {
      /* The original template string */
      var templateStr = text,
            templateFunc = compile(text),
            valueFuncs = valFuncMap || {};
      
      return {
         template: templateStr,
         /**
          * Process this template. The values in the optional passed map will override those that were
          * put by the put(String, String) function of this template
          * @param {Object} objMap The object containing tokens and their values as properties
          */
         process: function(objMap) {
            return templateFunc(objMap, valueFuncs);
         }
      };
   };
   
   $.extension("template", function(fmts) {
      return $.template(this.html(), fmts);
   });
})(h5);





/**
 * The DataList widget. Creates a selectable list from the specified data
 * @Usage 
 * $("selector").DataList(options);
 * The options object takes the following:
 * values:
 * {
 *    listClass: css class for list, default "list",
 *    itemClass: css class for list item, default "list-item",
 *    data: The data array, default empty array
 *    selectedIndex: The index of the item that needs to be selected by default,
 *    template: The template to use to render each item
 *    render: A function to render list item "function(list-widget, $(curr-item), index, data[index])"
 *    onselectionchange: a handler function called when list selection changes
 * }
 * @author aniketn3@gmail.com
 */
(function($) {
   var defaults = {
      listClass: "list",
      itemClass: "list-item",
      selectable: true,
      data: [],
      selectedIndex: -1,
      template: null,
      render: null,
      onselectionchange: function(currItem, oldItem) {}
   },
   isTypeOf = $.isTypeOf,
   forEach = $.forEach,
   uuid = $.uuid,
   UI_KEY = "uiItem",
   MODEL_KEY = "model",
   action = "ontouchstart" in document.documentElement ? "tap" : "click"; 
   
   /**
    * Render the item 
    * @param {type} widget The list widget
    * @param {type} uiItem The current UI item (li)
    * @param {type} objItem The model item
    * @param {type} itemIdx The index at which currently rendering
    * @param {type} opts The options passed to widget
    * @returns {unresolved} Either the rendered item that will be attached to the li element
    * (string, dom element) or the if renderer itself appends to li, returns null or undefined
    */
   function renderItem(widget, uiItem, objItem, itemIdx, opts)  {
      var content, i, len, itmCls = opts.itemClass, liRaw;
      uiItem.data(MODEL_KEY, objItem);

      if(itmCls) {
         for(i = 0, len = itmCls.length; i < len; i++) {
            uiItem.addClass(itmCls[i]);
         }
      }
      content = opts.render(widget, uiItem, itemIdx, objItem);
      
      liRaw = uiItem.get(0);
      if(!liRaw.id) {
         liRaw.id = "itm"+ uuid();
      }

      // check if the renderer has already appended
      if(content) {
         if(isTypeOf(content, "String"))   {
            uiItem.html(content);
         }else {
            uiItem.append(content);
         }
      }
      // @TODO will this create a leak?
      liRaw._item_ = uiItem; // store this to quickly retrieve the item selection change
      return uiItem;
   }
   
   $.extension("datalist", function(options) {
      // these are our final options
      var opts = $.shallowCopy({}, defaults, options),
      // copy the data array
      data = (opts.data || []).slice(0),
      // the current selected item
      selectedItem, 
      // all the items in our list
      allItems,
      // our root element, create it if not present
      listRoot,
      // existing children of this list root
      children,
            
      listClass = opts.listClass,
      
      enabled = true,
      element = this.get(0), 
      ul, widget;
      
      if(!element) {
         throw new Error("Datalist element not found. Please check your selector");
      }
      
      opts.listClass = listClass = listClass ? listClass.split(" ") : null;
      opts.itemClass = opts.itemClass ? opts.itemClass.split(" ") : null;
      
      opts.render = opts.render || function(list, item, idx, datum) {
         return opts.template ? opts.template.process(datum) : datum + "";
      };
      
      /*
       * Render the entire list widget
       */
      function render(selIndex) {
         allItems = [];
         listRoot.html("");
         
         if(data && data.length)   {
            var items = document.createDocumentFragment(), //not supported in IE 5.5
                  i, len, $li;
            for(i = 0, len = data.length; i < len; i++) {
               $li = $(document.createElement("li"));
               $li = renderItem(widget, $li, data[i], i, opts);
               items.appendChild($li.get(0));
               allItems[allItems.length] = $li;
               
               if(i === selIndex) {
                  selectedItem = $li;
                  $li.addClass("selected");
               }
            }
            listRoot.append(items);
         }
      }
      
      function insertItemsAt(arrData, idx) {
         var origItem, items, i, len, $li, arrLis = [], splice = Array.prototype.splice;
         idx = Number(idx);
         if(isNaN(idx) || idx < 0 || idx > data.length + 1) {
            return;
         }
         
         items = document.createDocumentFragment(); //not supported in IE 5.5
         for(i = 0, len = arrData.length; i < len; i++) {
            $li = $(document.createElement("li"));
            $li = renderItem(widget, $li, arrData[i], i, opts);
            items.appendChild($li.get(0));
            arrLis[arrLis.length] = $li;
         }
         
         if(idx === data.length) {
            listRoot.append(items);
         }else {
            origItem = allItems[idx];
            origItem.before(items);
         }
         
         splice.apply(allItems, [idx, 0].concat(arrLis));
         splice.apply(data, [idx, 0].concat(arrData));
      }
      
      function fireSelectionChanged(item)  {
         var old = null, ret;
         if(selectedItem)  {
            old = selectedItem;
            if(selectedItem === item)  {
               return;
            }
         }
         // this is needed so that onselection change handlers can can call this.getSelectedItem
         selectedItem = item; 
         
         ret = opts.onselectionchange.call(widget, item ? item.data(MODEL_KEY) : null, 
               old ? old.data(MODEL_KEY) : null);
         if(ret !== false) {
            if(old) {
               old.removeClass("selected");
            }
            selectedItem = item;
            if(selectedItem) {
               selectedItem.addClass("selected");
            }
         }else {
            selectedItem = old;
         }
      }
      
      function insertItemAt(objItem, idx) {
         var itm, origItem;
         idx = Number(idx);
         if(isNaN(idx) || idx < 0 || idx > data.length + 1) {
            return;
         }
         
         var $li = $(document.createElement("li"));
         itm = renderItem(widget, $li, objItem, idx, opts);
         
         if(idx === data.length) {
            listRoot.append(itm);
         }else {
            origItem = allItems[idx];
            origItem.before(itm);
         }
         allItems.splice(idx, 0, itm);
         data.splice(idx, 0, objItem);
      }
      
      function removeItemAt(idx) {
         var itm, objItm;
         idx = Number(idx);
         if(!isNaN(idx) && idx >= 0 && idx < data.length) {
            itm = allItems.splice(idx, 1)[0];
            objItm = data.splice(idx, 1)[0];
            if(itm && objItm) {
               listRoot.remove(itm.get(0));
               if(itm === selectedItem) {
                  selectedItem = null;
               }
            }
         }
      }
      
      function removeItems(filterFunc) {
         var filtered = [];
         forEach(data, function(datum, i) {
            if(filterFunc(datum)) {
               filtered[filtered.length] = i;
            }
         });
         
         forEach(filtered, function(fi) {
            removeItemAt(fi);
         });
      }
      
      function getItemFromEvent(e) {
         var t = e.target, parent = t.parentNode, item, ul = listRoot.get(0);
         
         if(t === ul) {
            return null;
         }
         
         if(parent === ul) {
            item = t;
         }else {
            while(parent && parent !== ul) {
               item = parent;
               parent = parent.parentNode;
            }
         } 
         return parent === ul ? item : null;
      }
      
      function on(evt, callback) {
         listRoot.on(evt, function(e) {
            var liElem = getItemFromEvent(e), item, itemData;
            if(!liElem) {
               return;
            }
            item = liElem._item_;
            itemData = item.data(MODEL_KEY);
            
            callback(e, item, itemData);
         });
      }
      
      if(element.tagName.toLowerCase() === "ul")  {
         listRoot = this;
      }else {
         listRoot = $(document.createElement("ul"));
         this.append(listRoot);
      }
      
      if(listClass) {
         forEach(listClass, function(cl) {
            listRoot.addClass(cl);
         });
      }
      
      if(opts.selectable) {
         on(action, function(e, li, item) {
            if(li) {
               fireSelectionChanged(li);
            }
         });         
      }
      
      // our public API that is exposed to the widget
      widget = {
         on: on,
         
         getElement: function() {
            return listRoot;
         },
         
         size: function() {
            return data.length;
         },
         
         setItems: function(itemData, selIndex) {
            // listRoot.html("");
            data = itemData || [];
            selectedItem = null;
            render(selIndex);
         },
         
         insertItemAt: function(objItem, i) {
            if(typeof i === "undefined") {
               i = data.length;
            }
            insertItemAt(objItem, i);
         },
         
         insertItemsAt: function(arrObjItems, i) {
            if(typeof i === "undefined") {
               i = data.length;
            }
            insertItemsAt(arrObjItems, i);
         },
         
         insertItem: function(objItem) {
            insertItemAt(objItem, data.length);
         },
         
         removeItemAt: function(i) {
            removeItemAt(i);
         },
         
         removeItems: function(filter) {
            if(typeof filter === "function") {
               removeItems(filter);
            }
         },
         
         setEnabled: function(bEnabled)  {
            enabled = bEnabled === false ? false : true;
            if(enabled) {
               listRoot.removeClass("disabled");
            }else {
               listRoot.addClass("disabled");
            }
         },
         
         getItems: function() {
            return data.slice(0);
         },

         getSelectedItem: function() {
            return selectedItem;
         },
                 
         getSelectedValue: function() {
            return selectedItem ? selectedItem.data(MODEL_KEY) : null;
         },
         
         getSelectedIndex: function() {
            var i, len;
            if(!selectedItem) {
               return -1;
            }
            for(i = 0, len = allItems.length; i < len && allItems[i] !== selectedItem; i++);
            return i === len ? -1 : i;
         },

         selectItemAt: function(idx)   {
            var len = allItems.length;
            if(idx < len && idx >= 0)  {
               fireSelectionChanged(allItems[idx]);
            }
         },
                 
         selectItem: function(filter) {
            var idx = this.indexOf(filter);
            if(idx !== -1) {
               this.selectItemAt(idx);
            }
         },
                 
         indexOf: function(filter) {
            var idx = -1, i, len = data.length;
            if(typeof filter === "function") {
               for(i = 0; i < len; i++) {
                  if(filter(data[i])) {
                     idx = i;
                     break;
                  }
               }
            }else {
               for(i = 0; i < len; i++) {
                  if(filter === data[i]) {
                     idx = i;
                     break;
                  }
               }
            }
            return idx;
         },
         
         getItemAt: function(idx) {
            var len = allItems.length;
            if(idx < len && idx >= 0)  {
               return allItems[idx].data(MODEL_KEY);
            }
            return null;
         },
         
         setItemAt: function(idx, datum) {
            var itm = allItems[idx], content;
            if(itm) {
               data[idx] = datum;
               itm.data(MODEL_KEY, datum);

               content = opts.render(widget, itm, idx, datum);
               // check if the renderer has already appended
               if(content) {
                  if(isTypeOf(content, "String"))   {
                     itm.html(content);
                  }else {
                     itm.append(content);
                  }
               }
            }
         },
         
         clearSelection: function() {
            fireSelectionChanged(null);
         },
         
         update: function(idx) {
            if(typeof idx !== "undefined") {
               renderItem(this, allItems[idx], data[idx], idx, opts);
            }
         }
      };
      
      // some initialization code (for lists with existing item markup) Experimental!!!
      children = listRoot.children(); // listRoot.find("li:nth-child(n+1)");
      if(children.length) { // we have children
         allItems = data = [];
         forEach(children, function(li, i) {
            var $li = $(li);
            // $li.data(UI_KEY, $li);
            li._item_ = $li; 
            $li.data(MODEL_KEY, li.textContent || li.innerText);
            allItems[allItems.length] = $li;
            if($li.hasClass("selected")) {
               selectedItem = $li;
            }
         });
      }else {
         render(opts.selectedIndex);
      }
      
      return widget;
   });
})(h5);





/*
 * <ul id="list">
 *  <li id="repeat_{$index}" class="list-item activable item_{$index}" data-template>
 *    {firstName} {lastName}
 *  </li>
 * </ul>
 * 
 * <script>
 *  var list = $("#list").repeat({
 *    items: ["one", "two", "three", "four", "five"]
 *  });
 *  list.on("selectionchange", (e) => {
 *    var items = e.currentSelection;
 *  });
 * </script>
 */
(function($) {
  var isTypeOf = $.isTypeOf,
      forEach = $.forEach,
      indexOf = Array.prototype.indexOf,
      uuid = $.uuid,
      // ACTION = "ontouchstart" in document.documentElement ? "tap" : "click",
      defaults = {};
      
  function asModel(arrItems) {
    return $.map(arrItems || [], function(item, i) {
      return {
        key: item.key || "repeat_" + uuid(),
        data: item
      };
    });
  }
      
  $.extension("repeat", function(opts) {
    var root = this,
        // element = root.get(0),
        options = $.shallowCopy({}, defaults, opts),
        templateElem = root.find("[data-template]"),
        items = asModel(options.items),
        renderer = options.render,
        template,
        widget;
        
    // remove the template elem
    if(templateElem.get(0)) {
      templateElem.get(0).removeAttribute("data-template");
      template = $.template(templateElem.outerhtml());
      templateElem.remove();
    }else {
      template = $.template("{item}");
    }
    
    function renderItem(item, index) {
      var itemElem = $(template.process({
        $index: index,
        item: item.data
      }));
      
      itemElem.attr("id", item.key);
      
      if(renderer) {
        renderer(itemElem, index, item.data);
      }
      return itemElem.get(0);
    }
    
    function render() {
      var frag = document.createDocumentFragment();
      forEach(items, function(item, i) {
        var itemElem = renderItem(item, i);
        frag.appendChild(itemElem);
      });
      root.html('').append(frag);
    }
    
    function getItemFromEvent(e) {
      var t = e.target, parent = t.parentNode, tmpElem, rootElem = root.get(0);
      if(t === rootElem) {
        return null;
      }

      if(parent === rootElem) {
        tmpElem = t;
      }else {
        while(parent && parent !== rootElem) {
          tmpElem = parent;
          parent = parent.parentNode;
        }
      }
      return parent === rootElem ? tmpElem : null;
    }
        
    widget = {
      element: root,
      
      onItem: function(event, callback) {
        root.on(event, function(e) {
          var itemElem = getItemFromEvent(e);
          if(!itemElem) {
            return;
          }
          var idx = indexOf.call(root.children(), itemElem);
          callback(e, {
            item: items[idx].data,
            index: idx,
            element: itemElem
          });
        });
        return this;
      },
      
      size: function() {
        return items.length;
      },
      
      setItems: function(arrItems) {
        items = asModel(arrItems);
        render();
      },
      
      getItems: function() {
        return $.map(items, function(itm, i) {
          return itm.data;
        });
      },
      
      appendItem: function(itms) {
        if(!$.isArray(itms)) {
          itms = [itms];
        }
        itms = asModel(itms);
        var idx, frag = document.createDocumentFragment();
        for(var i = 0, len = itms.length; i < len; i += 1) {
          idx = items.push(itms[i]);
          frag.appendChild(renderItem(itms[i], idx));
        }
        root.append(frag);
      },
      
      prependItem: function(itms, preserveOrder) {
        if(!$.isArray(itms)) {
          itms = [itms];
        }
        itms = asModel(itms);
        var idx, frag = document.createDocumentFragment(), 
            method = preserveOrder ? 
                function(itm) {
                  frag.appendChild(itm);
                } :
                function(itm, fc) {
                  frag.insertBefore(itm, fc);
                };
        for(var i = 0, len = itms.length; i < len; i += 1) {
          idx = items.unshift(itms[i]);
          method(renderItem(itms[i], idx), frag.firstChild);
        }
        root.prepend(frag);
      }
    };
    
    render();
    
    return widget;
  });
})(h5);
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


/*
 * A working solution for activable elements
 * Requires .activable and .activable.active classes to change appearance
 */
;(function($) {
   var touchstart = "touchstart", touchend = "touchend", touchmove = "touchmove";
   if(! ("ontouchstart" in document.documentElement)) {
        touchstart = "mousedown";
        touchmove = "mousemove";
        touchend = "mouseup";
   }
   
   $.extension("activables", function() {
      var element, timer, self = $(this);

      function activate() {
         // console.log("activating...");
         element.addClass("active");
      }

      function deactivate() {
         if(!element) return;
         // console.log("de-activating...");
         // console.log("removing listener");
         self.un(touchmove, move);
         element.removeClass("active");
         element = null;
      }

      function start(e) {
         if(element) {return;}
         
         var level = 3, target = e.target, elem;
         while(level-- && target) {
            elem = $(target);
            if(elem.hasClass("activable") || elem.hasClass("button")) {
               element = elem;
            }else {
               target = target.parentNode;
            }
         }

         if(!element) {
            return;
         }
         
         // console.log("adding listener");
         self.on(touchmove, move);
         
         // start the timer
         timer = setTimeout(activate, 90);
      }

      function end(e) {
         if(element) {
            clearTimeout(timer);

            if(element.hasClass("active")) {
               deactivate();
            }else {
               element.addClass("active");
               setTimeout(deactivate, 90);
            }
         }
      }

      function move(e) {
         // console.log("move...");
         if(element) {
            // console.log("moved!! de-activating...");
            clearTimeout(timer);
            deactivate();
         }
      }

      // make all the activable elements change color when they are active
      self.on(touchstart, start).on(touchend, end);
   });
})(h5);




// A very simple notifications plugin
(function ($) {
  $.extension("notifications", function() {
    var self = this,
        Events = $.EventTypes,
        timeoutId,
        msgQueue = [],
        running = false,
        uuid = $.uuid,
        widget = {
          clear: function(id) {
            if(id) {
              self.remove("#" + id);
              if(self.children().length === 0) {
                self.addClass("hidden");
              }
              return;
            }else {
              msgQueue.splice(0, msgQueue.length);
              self.html("");
              self.addClass("hidden");
            }
          }
        };

    function clear() {
      self.removeClass("show");
      widget.clear();
    }

    function showMessages() {
      var msg;
      if(msgQueue.length) {
        msg = msgQueue.shift();
        self.prepend([
          '<p data-sticky="', msg.sticky, '" id="', msg.id, '" class="message ', msg.type, '">',
          msg.content,
          '</p>'
        ].join(""));
        var m = self.find("#" + msg.id),
            remove = function () {
              widget.clear(msg.id);
            };
        setTimeout(function () {
          m.addClass("show");
          if(!msg.sticky) {
            timeoutId = setTimeout(remove, (msg.type === "error" ? 6000 : 3000));
          }
          m.on(Events.tap, remove);
          timeoutId = setTimeout(showMessages, 500);
        }, 50);
      }else {
        if(self.children().length === 0) {
          self.addClass("hidden");
        }
        running = false;
      }
    }

    function notify() {
      if(!running) {
        running = true;
        self.removeClass("hidden");
        showMessages();
      }
    }

    ["info", "error", "success", "warn"].forEach(function (val) {
      widget[val] = function (msg, sticky) {
        var msgId = "msg_" + uuid();
        msgQueue.push({
          id: msgId,
          type: val,
          content: msg,
          sticky: !!sticky
        });
        notify();
        return msgId;
      };
    });

    widget.alert = function (msg, callback, title, label) {
      if(navigator.notification) {
        navigator.notification.alert(msg, callback, title, label);
      }else {
        alert(msg);
        if(callback) {
          callback();
        }
      }
    };

    widget.confirm = function (msg, callback, title, arrLabels) {
      if(navigator.notification) {
        navigator.notification.confirm(msg, callback, title, arrLabels);
      }else {
        var val = confirm(msg);
        callback(val ? 1 : 2);
      }
    };

    widget.vibrate = function(duration) {
      if(navigator.vibrate) {
         navigator.vibrate(duration || 40);
      }
    };

    return widget;
  });
})(h5);
// Simple application dialogs
(function($) {
  $.extension("dialogmanager", function() {
    var dialogPane = this,
        currDialogInfo = null,
        dialogs = {},
        noop = function() {},
        body = $(document.body),
        transitionEndEvent = $.Env.property("transitionend") || "transitionend";

    var manager =  {
      register: function(name, selector, options) {
        var diag = $(selector),
            diagElem = diag.get(0),
            diagParent = diagElem.parentNode,
            dialogInfo;

        if(diagParent) {
          diagParent.removeChild(diagElem);
          diag.addClass("hidden").addClass("dialog");
          dialogPane.append(diag);
          dialogInfo = dialogs[name] = {
            dialog: diag,
            initialize: options.initialize || noop,
            onshow: options.onshow || noop,
            onhide: options.onhide || noop
          };

          diag.on(transitionEndEvent, function(e) {
            if(diag.hasClass("in")) {
              diag.dispatch("show");
            }else {
              diag.dispatch("hide");
            }
          });

          dialogInfo.initialize(diag);
        }
      },

      showDialog: function(name) {
        var dialogInfo = dialogs[name];
        if(!dialogInfo) {
          throw new Error("Dialog not registered");
        }

        // if already showing dialog, hide it. We don't support multiple dialogs
        if(currDialogInfo) {
          return;
        }

        body.addClass("dialog-showing");

        // show dialog pane
        dialogPane.addClass("showing");

        currDialogInfo = dialogInfo;
        dialogInfo.dialog.removeClass("hidden");
        dialogInfo.dialog.once("show", function() {
          dialogInfo.onshow(dialogInfo.dialog);
        });

        setTimeout(function() {
          currDialogInfo.dialog.addClass("in");
        }, 50);
      },

      isDialogShowing: function() {
        return !!currDialogInfo;
      },

      hideCurrentDialog: function(callback) {
        body.removeClass("dialog-showing");
        if(currDialogInfo) {
          currDialogInfo.dialog.removeClass("showing");
          currDialogInfo.dialog.once("hide", function() {
            dialogPane.removeClass("showing");
            currDialogInfo.dialog.addClass("hidden");
            if(callback) {
              callback(currDialogInfo.dialog);
            }
            currDialogInfo.onhide(currDialogInfo.dialog);
            currDialogInfo = null;
          });

          currDialogInfo.dialog.removeClass("in");
        }
      }
    };

    return manager;
  });
})(h5);