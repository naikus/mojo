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
   
   function UriTemplate(uriPattern) {
      var paramPattern = /:([\w\.-]+)/g, 
            uriPattern = uriPattern,
            
            // the order of these two lines is important, in IE8, otherwise the paramPattern.exec will return null
            expander = compile(uriPattern, paramPattern),
            genPattern = new RegExp("^" + uriPattern.replace(paramPattern, "(.*[^/])") + "$"),
            
            
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
      transitionEndEvent = Env.property("transitionend") || "transitionend",
      hasHashchange = Env.property("hashchange");
      
   $.Application = function() {
      var noop = function() {},
      controllerMethods = ["initialize", "activate", "update", "deactivate", "destroy"],
      
      routes = [],
      stack = [],
      
      application,
      
      transitionProp, // the transition property that we are tracking (e.g. transform, opacity, position, etc.)
      
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

      function pushView(path, data) {
         var controller, ui, route = getMatchingRoute(path), params;
         if(!route) {
            console.log("Unrecognized route: " + path);
            return;
         }
         
         params = route.routeTemplate.match(path);
         ui = route.ui; 
         controller = route.controller;
         
         // see if this view is initialized (one time only)
         if(route.view && !route.ui) {
            // initialize the route crating any controllers by calling factories and initializing controllers
            initializeRoute(route);

            // init the controller
            ui = route.ui;
            controller = route.controller;

            ui.addClass("showing");
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

         // activate the controller
         ui.addClass("showing");
         controller.activate(params, data);
         
         // indicate that this view is transitioning
         /*
         if(currRoute && route.view) {
            currRoute.ui.addClass("transitioning");
         }
         ui.addClass("transitioning");
         */
         
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
         }, 150);

         stack.push(route);
      }

      function popView(data) {
         var route, currRoute, path, ui, params;

         // no routes on stack
         if(stack.length <= 1) {
            console.log("Can't pop view, last in stack.");
            return;
         }

         currRoute = stack.pop();
         route = stack[stack.length - 1];
         path = route.realPath;
            
         params = route.routeTemplate.match(path);
         ui = route.ui;
         // if its in the history and not stacked, stack it first
         if(!ui.hasClass("stack") && !ui.hasClass("transition")) {
            ui.addClass("stack").addClass("transition");
         }
         route.controller.activate(params, data);
         ui.addClass("showing");

         // indicate that this view is transitioning
         /*
         route.ui.addClass("transitioning");
         currRoute.ui.addClass("transitioning");
         */
        
         setTimeout(function() {
            currRoute.controller.deactivate();
            popViewUi(currRoute.ui);
            unstackViewUi(route.ui);
         }, 150);
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
                       exeScripts = [], code = [], finalScript;
      
               scripts.forEach(function(script) {
                  var scr = $(script), type = scr.attr("type");
                  if(!scr.attr("src") && (!type || type.indexOf("/javascript") !== -1)) {
                     html.remove(script);
                     exeScripts[exeScripts.length] = script;
                  }
               });
      
               div.addClass("remote");
               div.attr("data-id", templateUrl);
               div.append(html);
      
               viewPort.append(div);
      
               for(var i = 0, len = exeScripts.length; i < len; i++) {
                   code[code.length] = exeScripts[i].textContent;
               }
      
      
               finalScript = document.createElement("script");
               finalScript.textContent = code.join('\n');
      
               div.append(finalScript);
      
               if(callback) {
                  callback(templateUrl);
               }
            }
         });
      }
      

      // UI Transitioning CSS class changes -------------------------------------------------------------

      function unstackViewUi(ui) {
         ui.addClass("transitioning").removeClass("stack").addClass("in");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      function popViewUi(ui) {
         ui.addClass("transitioning").removeClass("in").addClass("pop");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      function stackViewUi(ui) {
         ui.addClass("transitioning").addClass("stack").removeClass("in");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      function pushViewUi(ui) {
         ui.addClass("transitioning").addClass("transition").addClass("in");
         if(!hasTransition || !transitionProp) {
            handleViewTransitionEnd({target: ui.get(0), propertyName: transitionProp});
         }
      }

      // ------------------------------------------------------------------------------------------------

      function handleOverlayTransitionEnd(evt) {
      }

      function handleViewTransitionEnd(evt) {
         var target = evt.target, ui = $(target), route = getRouteByPath(ui.data("path"));
         
         if(!route || (transitionProp !== null && evt.propertyName.indexOf(transitionProp) === -1)) {
            return; // not a view or not a 'transitionProp' transition on this view.
         }

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
      function RouteHandler(e) {
         if(e && RouteHandler.ignoreNext) {
            // console.log("RouteHandler: Ignoring hashchange this time");
            RouteHandler.ignoreNext = false;
            return;
         }
     
         var nPath = getPath(), route = getMatchingRoute(nPath), currRoute, params;

         // console.log("Calling route handler: " + nPath);
         if(!route) {
            console.log("No matching route, doing nothing");
            return;
         }
         currRoute = stack[stack.length - 1];
         params = route.routeTemplate.match(nPath);

         // same route handler probably params are different, so update
         if(currRoute === route) {
             if(currRoute.realPath !== nPath) {
                 currRoute.realPath = nPath;
                 route.controller.update(params);
             }
         }else {
            // either front or back or hyperlink is clicked
            if(route === stack[stack.length - 2]) {
               popView(null);
            }else {
               pushView(nPath, null);
            }
         }
      }
      RouteHandler.ignoreNextHashChange = function() {
         return this.ignoreNext = true;
      };
      
      $(window).on("hashchange", RouteHandler);

      // ---------------------------- Application API --------------------------
      application = {
         addRoute: addRoute,

         showView: function(path, data) {
            RouteHandler.ignoreNextHashChange();
            window.location.hash = path;
            pushView(path, data);
         },
                 
         popView: function(result) {
            var len = stack.length;
            if(len >= 2) {
                var route = stack[len - 2];
                RouteHandler.ignoreNextHashChange();
                window.location.hash = route.realPath;
                popView(result);
            }
         },
                 
         loadView: function(viewTemplateUrl, path, data) {
            var route = getMatchingRoute(path), app = this;
            if(!route) {
                loader(viewTemplateUrl, function() {
                    app.showView(path, data);
                });
            }else {
                this.showView(path, data);
            }
         },
                 
         getViewPort: function() {
            return viewPort;
         },

         initialize: function(options) {
            viewPort = options.viewPort, 
            transitionProp = "transitionProperty" in options ? options.transitionProperty : "transform";
            
            var path;
            if(options.loadFromPath !== false) {
               path = getPath();
            }
            this.showView(path || options.startView);
         }
      };
      
      return application;
   };
    
})(h5);



;(function($) {
   var forEach = $.forEach, 
      getTypeOf = $.getTypeOf,
      Elem = document.documentElement,
      setValue;

   function setValueStandard(arrElems, value, formatter) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].textContent = formatter ? formatter(value) : value;
      }
   }
   
   function setValueIE(arrElems, value, formatter) {
      for(var i = 0, len = arrElems.length; i < len; i++) {
         arrElems[i].innerText = formatter ? formatter(value) : value;
      }
   }
   
   function getValue(key, obj) {
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
         return "";
      }
      val = val || tmp;
      if(typeof val === "function") {
         return val.call(par);
      }else {
         return val;
      }
   }
   
   // use appropriate function for textContent
   /*
    * This is done for performance reasons.
    */
   setValue = "textContent" in Elem ? setValueStandard : setValueIE;
   
   $.extension("binder", function(options) {
      options = options || {};
      var model = options.model, self = this, boundElemMap = {}, formatters = options.formatters || {};
      
      
      function applyBindings() {
         forEach(boundElemMap, function(arrElems, valKey) {
            var value = getValue(valKey, model), formatter = formatters[valKey];
            setValue(arrElems, value, formatter);
         });
      }

      function updateModel(mdl, pKey, modelRef) {
         var parentKey = pKey ? pKey + "." : "", pModel = modelRef || model;
         forEach(mdl, function(value, key) {
            var actKey = parentKey + key, type = getTypeOf(value);
            if(type === "Object") {
               updateModel(value, key, pModel[key] || (pModel[key] = {}));
            }else {
               pModel[key] = value; //update our model
               var arrElems = boundElemMap[actKey];
               if(arrElems) {
                  var formatter = formatters[actKey];
                  setValue(arrElems, value == null ? "" : value, formatter); //intentional == check, for '0' values
               }
            }
         });
      }

      function updateModelValue(key, value) {
         var keys = key.split(","), modelValue, partKey, tmpModel = model;
         for(var i = 0, len = keys.length; i < len; i++) {
            partKey = keys[i];
            modelValue = tmpModel[partKey];
            if(i === len - 1) {
               tmpModel[partKey] = value;
            }else {
               if(!modelValue) {
                  tmpModel[partKey] = {};
               }
               tmpModel = tmpModel[partKey];
            }
         }
         
         // update the view
         var arrElems = boundElemMap[key];
         if(arrElems) {
            setValue(arrElems, value == null ? "" : value); //intentional == check, for '0' values
         }
      }      
      
      // search for all bound elements
      self.find("[data-bind]").forEach(function(elem) {
         var key = elem.getAttribute("data-bind"), arr = boundElemMap[key];
         if(!arr) {
            arr = boundElemMap[key] = [];
         }
         arr[arr.length] = elem;
      });
      
      if(model) {
         applyBindings(boundElemMap, model);
      }
      
      return {
         apply: function(mdl) {
            model = mdl;
            applyBindings(boundElemMap, model);
         },
         
         update: function(key, val) {
            if(!model) {
               model = {};
            }
            if(typeof key === "string") {
               updateModelValue(key, val);
            }else {
               updateModel(key); // key is actually a partial model object
            }
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

      return function(objMap) {
         var str = [], i, len, part;
         if(!objMap) {
            return allParts.join("");
         }
         
         for(i = 0, len = allParts.length; i < len; i++)  {
            part = allParts[i];            
            if(typeof(part) === "string")   {
               str[str.length] = part;
            }else {
               str[str.length] = getValue(part.key, objMap);
            }
         }
         return str.join("");
      };
   }
   
   function getValue(key, obj) {
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
         return "";
      }
      val = val || tmp;
      if(typeof val === "function") {
         return val.call(par);
      }else {
         return val;
      }
   }
   
   $.template = function(text) {
      /* The original template string */
      var templateStr = text,
      templateFunc = compile(text);
      
      return {
         template: templateStr,
         /**
          * Process this template. The values in the optional passed map will override those that were
          * put by the put(String, String) function of this template
          * @param {Object} objMap The object containing tokens and their values as properties
          */
         process: function(objMap) {
            return templateFunc(objMap);
         }
      };
   };
   
   $.extension("template", function() {
      return $.template(this.html());
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
    * Render each item using the specified renderer
    */
   function renderItem(widget, objItem, itemIdx, opts)  {
      var li = document.createElement("li"), item = $(li), content, liRaw, i, len, itmCls = opts.itemClass;
      item.data(MODEL_KEY, objItem);

      if(itmCls) {
         for(i = 0, len = itmCls.length; i < len; i++) {
            item.addClass(itmCls[i]);
         }
      }
      content = opts.render(widget, item, itemIdx, objItem);
      
      liRaw = item.get(0);
      if(!liRaw.id) {
         liRaw.id = "itm"+ uuid();
      }

      // check if the renderer has already appended
      if(content) {
         if(isTypeOf(content, "String"))   {
            item.html(content);
         }else {
            item.append(content);
         }
      }
      // @TODO will this create a leak?
      li._item_ = item; // store this to quickly retrieve the item selection change
      return item;
   }
   
   $.extension("datalist", function(options) {
      // these are our final options
      var opts = $.extend({}, defaults, options),
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
      
      opts.listClass = listClass = listClass ? listClass.split(" ") : null;
      opts.itemClass = opts.itemClass ? opts.itemClass.split(" ") : null;
      
      opts.render = opts.render || function(list, item, idx, datum) {
         return opts.template ? opts.template.process(datum) : datum + "";
      };
      
      /**
       * Render the entire list widget
       */
      function render(selIndex) {
         allItems = [];
         listRoot.html("");
         
         if(data && data.length)   {
            var items = document.createDocumentFragment(); //not supported in IE 5.5
            forEach(data, function(datum, i) {
               var $li = renderItem(widget, datum, i, opts);
               items.appendChild($li.get(0));
               allItems[allItems.length] = $li;
               
               if(i === selIndex) {
                  selectedItem = $li;
                  $li.addClass("selected");
               }
               
            });
            listRoot.append(items);
         }
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
         itm = renderItem(widget, objItem, idx, opts);
         
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
            listRoot.html("");
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




/**
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
         },
         getValue: function() {
            return state;            
         }
      };
      
      return widget;
   });
})(h5);



/*
 * A working solution for activable elements
 * Requires .activable and .activable.active classes to change appearance
 */
(function($) {
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
         timer = setTimeout(activate, 100);
      }

      function end(e) {
         if(element) {
            clearTimeout(timer);

            if(element.hasClass("active")) {
               deactivate();
            }else {
               element.addClass("active");
               setTimeout(deactivate, 100);
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



(function($)   {
   var defaults = {
      ontabchange: function() {},
      selectedIndex: 0
   }, 
   action = "ontouchstart" in document.documentElement ? "tap" : "click";
   
   $.extension("tabstrip", function(options)  {
      var widget,
         // these are our final options
         opts = $.extend({}, defaults, options),
         // our plugin is bound to an HTML ul element
         tabs = [], 
         
         self = this,
         
         // selected tab's DOM element
         selectedTabInfo;
         
      function selectTab(tabInfo) {
         var oldInfo = selectedTabInfo, 
                 oldTab = oldInfo ? oldInfo.tab : null,
                 tab = tabInfo ? tabInfo.tab : null,
                 retVal;
         
         if(!tabInfo || tabInfo === selectedTabInfo) {
            return;
         }
         
         selectedTabInfo = tabInfo;
         retVal = opts.ontabchange.call(widget, tab, oldTab);
         
         if(retVal !== false) {
            if(oldInfo) {
               oldTab.removeClass("selected");
               oldInfo.content.removeClass("active");
            }
            
            tab.addClass("selected");
            tabInfo.content.addClass("active");
         }else {
            selectedTabInfo = oldInfo;
         }
      }
      
      function indexOf(tabInfo) {
         for(var i = 0, len = tabs.length; i < len; i++) {
            if(tabInfo === tabs[i]) {
               return i;
            }
         }
         return -1;
      }
      
      // our widget API object
      widget = {
         getSelectedIndex: function()  {
            try {
               return indexOf(selectedTabInfo);
            }catch(e) {
               for(var i = 0, len = tabs.length; i < len && tabs[i] !== selectedTabInfo; i++);
               return i === len ? -1 : i;
            }
         },
         
         selectTab: function(idx)   {
            var tab = tabs[idx];
            if(tab) {
               selectTab(tab);
            }
         },
         toString: function() {
            return "tabstrip " + self.selector;
         }
      };
      
      // initialization code
      $.forEach(this.children(".tab"), function(elem) {
         var tb = $(elem), tabInfo;
         
         tabs[tabs.length] = tabInfo = {
            tab: tb,
            content: $(tb.attr("data-ref"))
         };
         tb.on(action, function() {
            selectTab(tabInfo);
         });
      });
      
      // by default select the tab as specified by selectedIndex
      selectTab(tabs[opts.selectedIndex || 0]);
      
      return widget;
   });
})(h5);




