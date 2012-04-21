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
      data: [],
      selectedIndex: -1,
      template: null,
      render: null,
      onselectionchange: function(currItem, oldItem) {}
   },
   isTypeOf = $.isTypeOf,
   forEach = $.forEach,
   uuid = $.uuid,
   action = "ontouchstart" in document.documentElement ? "tap" : "click"; 
   
   /**
    * Render each item using the specified renderer
    */
   function renderItem(widget, objItem, itemIdx, opts)  {
      var li = document.createElement("li"), item = $(li), content;
      item.data("model", objItem);
      item.data("index", itemIdx);

      if(opts.itemClass) {
         forEach(opts.itemClass, function(cl) {
            item.addClass(cl);
         });
      }
      // item.attr("id", objItem.id || "li" + uuid());
      content = opts.render(widget, item, itemIdx, objItem);

      // check if the renderer has already appended
      if(!item.html()) {
         if(isTypeOf(content, "String"))   {
            item.html(content);
         }else {
            item.append(content);
         }
      }
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
         
         ret = opts.onselectionchange.call(widget, item, old);
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
      
      if(element.tagName.toLowerCase() === "ul")  {
         listRoot = this;
         ul = listRoot.get(0);
      }else {
         ul = document.createElement("ul");
         this.append(ul);
         listRoot = $(ul);
      }
      
      if(listClass) {
         forEach(listClass, function(cl) {
            listRoot.addClass(cl);
         });
      }
      
      listRoot.on(action, function(e) {
         var t = e.target, parent = t.parentNode, idx, item;
         if(parent === ul) {
            item = t;
         }else {
            while(parent && parent !== ul) {
               item = parent;
               parent = parent.parentNode;
            }
         }
         idx = $(item).data("index");
         if(typeof idx !== "undefined") {
            item = allItems[idx];
            fireSelectionChanged(item);
         }
      });
      
      // our public API that is exposed to the widget
      widget = {
         getElement: function() {
            return listRoot;
         },
         
         setItems: function(itemData, selIndex) {
            listRoot.html("");
            data = itemData || [];
            selectedItem = null;
            render(selIndex);
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
         
         setItemAt: function(idx, datum) {
            var itm = allItems[idx], content;
            if(itm) {
               data[idx] = datum;
               itm.data("model", datum);

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
      children = listRoot.find("li:nth-child(n+1)");
      if(children.count()) { // we have children
         allItems = data = [];
         children.forEach(function(li, i) {
            var $li = $(li);
            $li.data("index", i);
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



/**
 * The Application module. This module is responsible for managing the application's views and their lifecycle
 * The application is responsible for following:
 * <ul>
 *    <li>Creating and instantiating the views from registered factory objects</li>
 *    <li>Pushing, popping views</li>
 *    <li>Transitioning views</li>
 * </ul>
 * 
 * @author aniketn3@gmail.com
 */
(function(window, $) {
   "use strict";
   if(window.mojo) {
      return;
   }
   // the global mojo namespace
   var forEach = $.forEach,
      
      style = window.document.createElement("div").style,
      hasTransitionSupport = false,
      transitionEvts = {
         "": "transitionend", 
         "Webkit": "webkitTransitionEnd",
         "Moz": "transitionend",
         "O": "oTransitionEnd",
         "ms": "MSTransitionEnd"
      },
      transitionEndEvent,
      
      hasHashChange = ("onhashchange" in window),
      
      mojo = {};
      
      
   // check for CSS transition support
   (function() {
      forEach(transitionEvts, function(evt, pfx) {
         if(typeof style[pfx + "Transition"] !== "undefined") {
            transitionEndEvent = evt;
            hasTransitionSupport = true;
         }
      });
      if(!hasTransitionSupport) {
         transitionEndEvent = "transitionend";
      }
      // console.log("Hashchange supported: " + hasHashChange + ", Transition Supported: " + hasTransitionSupport + ", Transition Event: " + transitionEndEvent);      
   }());
      
   /**
    * The view port object. The view port provides various features for managing views and their
    * lifecycle. It allows for registering views with the viewport and switching between views
    */
   mojo.Application = function() {
      var noop = function() {},
         // default application options, overriden in opts
         defaults = {
            startView: "main"
         },
         options, 
         // all the views are stored here keyed by view ids
         views = {},
         // current views on the stack to manage transitions. This stores the view ids
         viewStack = [],
         // the view port object
         app,
         
         viewPort,
         
         defController = {
            initialize: noop,
            activate: noop,
            deactivate: noop,
            destroy: noop
         };
         
      function defViewFactory() {
         return defController;
      }
         
      /**
       * Just ensures that all the lifecycle methods are available for the specified view object
       * If not adds them
       * @param controller The view object
       */
      function ensureLifecycle(controller) {
         controller.initialize = controller.initialize || noop;
         controller.activate = controller.activate || noop;
         controller.deactivate = controller.deactivate || noop;
         controller.destroy = controller.destroy || noop;
         
         controller.onTransitionIn = controller.onTransitionIn || noop;
         controller.onTransitionOut = controller.onTransitionOut || noop;
      }
      
      function getViewIndexOnStack(id) {
         for(var i = 0, len = viewStack.len; i < len && viewStack[i] !== id; i++);
         return i === len ? -1 : i;
      }
      
      function getViewId(url) {
         if(!url) {
            return null;
         }
         var hash = url.lastIndexOf("#");
         if(hash === -1) {
            return null;
         }
         return url.substring(hash + 1);
      }
      
      function initialize(id, info) {
         // see if the wrapper element for this view exists
         var ui = info.ui = $("#" + id), controller;
         if(!ui.count()) {
            delete views[id];
            throw new Error("Wrapper element for " + id + " not found");
         }

         // add transition handling listener
         ui.on(transitionEndEvent, info.overlay ? onOverlayTransitionEnd : onViewTransitionEnd);

         controller = info.controller = info.factory(app, ui);
         ensureLifecycle(controller);
         // initialize the newly created controller
         controller.initialize();
      }
      
      /**
       * Pushes the view specified by 'id' and makes the view active. Following are the steps:
       * <ol>
       *    <li>Find and create (if necessary from the supplied factory function) the view object</li>
       *    <li>If newly created, initialize the view by calling 'initialize(app) function</li>
       *    <li>Activate the view by calling the activate(data) function on the view object</li>
       *    <li>Transition the current view out of view port</li>
       *    <li>Deactivate the transitioned view on completion of the transition</li>
       * </ol>
       * 
       * @param {String} id The view id
       * @param {Object} data The data for the new view
       */
      function pushView(id, data) {
         var nxtInfo = views[id], 
            nxtUi,
            currInfo, 
            len = viewStack.length,
            currId = len ? viewStack[len - 1] : null;
            
         if(currId === id) {
            return;
         }
            
         // check if the view exists
         if(!nxtInfo) {
            throw new Error("No such view: " + id);
         }
         
         // create and initialize new view if applicable
         if(!nxtInfo.ui) {
            initialize(id, nxtInfo);
         }

         nxtUi = nxtInfo.ui;
         // activate the new view
         nxtInfo.controller.activate(data);
         nxtUi.addClass("showing");
         
         // transition views
         setTimeout(function() {
            // transition out the old view, this is not the same as popping a view
            if(currId) {
               currInfo = views[currId];
               currInfo.controller.deactivate();
               // transition out the current view
               currInfo.ui.addClass("out").removeClass("in");
               // if no transition support dispatch custom event
               if(!hasTransitionSupport) {
                  currInfo.ui.dispatch("transitionend");
               }
            }
            // transition in the new view
            nxtUi.addClass("transition").addClass("in");
            // if no transition support dispatch custom event
            if(!hasTransitionSupport) {
               nxtUi.dispatch("transitionend");
            }
         }, 100);
         
         viewStack.push(id);
         // console.log("view stack: " + viewStack.join(","));
      }
      
      /**
       * Pops the current view and restores the previous view. Following are the sequence of actions taken:
       * <ol>
       *    <li>Pop the current view from the stack</li>
       *    <li>Activate the last view on the stack by calling activate method on the view</li>
       *    <li>Transition the popped view out of the view port</li>
       *    <li>Transition the restored view into the view port</li>
       *    <li>After transition completes, deactivate the popped view</li>
       * </ol>
       * 
       * @param {Object} data The data to provide to the restored view. This is passed to the activate() function
       */
      function popView(data) {
         var prevInfo, prevUi, currInfo, len = viewStack.length;
         if(len === 1) {
            console.log("Can't pop, last in stack");
            return;
         }
         currInfo = views[viewStack.pop()];
         prevInfo = views[viewStack[len - 2]]; // because we popped, the last item is at len - 1 - 1 
         
         // console.log("popping: " + currInfo.id + ", showing: " + prevInfo.id);
         
         prevUi = prevInfo.ui;
         
         // activate the new view
         prevInfo.controller.activate(data);
         prevUi.addClass("showing");
         
         // transition the views
         setTimeout(function() {
            currInfo.controller.deactivate();
            currInfo.ui.removeClass("in").addClass("pop");
            
            prevUi.removeClass("out").addClass("in");
         }, 100);
         
         // console.log("view stack: " + viewStack.join(","));
      }
      
      function pushOverlay(id, data) {
         // @TODO: Implement
      }
      
      function popOverlay(data) {
         // @TODO: Implement
      }
      
      /**
       * Handles some actions after views transition in or out of the view port
       */
      function onViewTransitionEnd(evt) {
         var target = evt.target, viewId = target.id, viewInfo = views[viewId], controller, el;
         
         if(!viewInfo) {
            return; // not a view
         }
         
         el = viewInfo.ui;
         controller = viewInfo.controller;
         
         // deactivate if the view has transitioned out
         if(el.hasClass("out")) {
            controller.onTransitionOut();
            el.removeClass("showing");
         }
         
         // deactivate if the view was popped, remove all transitions and all transition CSS so that the view is
         // returned to its original position
         if(el.hasClass("pop")) {
            controller.onTransitionOut();
            el.removeClass("showing").removeClass("transition").removeClass("pop");
         }
         
         // for history support, experimental!
         if(el.hasClass("in")) {
            controller.onTransitionIn();
            window.location.hash = viewId;
         }
      }
      
      function onOverlayTransitionEnd(evt) {
         // @TODO: Implement
      }
      
      function getCurrentViewId() {
         var len = viewStack.length;
         return len ? viewStack[len - 1] : null;
      }
      
      function register(id, fac, bOverlay) {
         var info, old = views[id];

         // check if this view is trying to register itself again
         old = views[id];
         if(old) {
            throw new Error("View " + id + " already exists");
         }

         // maintain the state of this view in a secret :) object
         info = {
            id: id,
            ui: null,
            controller: null,
            overlay: !!bOverlay,
            factory: fac || defViewFactory
         };
         views[id] = info;
      }
      
      /**
       * Handle back button
       */
      (function() {
         // some browsers do not support hashchange's event.oldURL and event.newURL 
         var oUrl = null, nUrl = window.location.href;
         
         $(window).on("hashchange", function(e) {
            oUrl = nUrl;
            nUrl = window.location.href;
            
            var startId = options.startView, 
               id = getViewId(nUrl) || startId, 
               oId = getViewId(oUrl) || startId, 
               curId = getCurrentViewId(), 
               lastId;
               
            if(!views[id]) { // this hash change was triggered by some link or something else
               return;
            }
               
            if(curId !== id) { // either front or back button is pressed
               lastId = viewStack[viewStack.length - 2];
               if(lastId === id) { // back button pressed
                  popView();
               }else {
                  pushView(id);
               }
            }
         });
      })();
       
      app = {
         /**
          * Registeres a view with this application. The id of the view and a factory function is
          * provided for registeration. 
          * At the time of instantiation, a DOM element corrosponding to the view (whose id is the same
          * as view id) has to exist or it will cause an exception to be thrown
          * @param {String} id The id of the new view
          * @param {Function} fac The factory function that creates the view object. This function is
          * passed two parameters, the application object and the h5 UI element
          * @example 
          * application.registerView("myView", function(app, ui) {
          *    return {
          *       initialize: function() {
          *          var action = document.createTouch ? "tap" : "click";
          *          ui.on(action, function(e) {
          *             if(app.getCurrentViewId() === "yetanother") {
          *                app.popView(["From", "Yet", "Another", "View"]);
          *                e.stopPropagation();
          *                e.preventDefault();
          *             }
          *          });
          *       }
          *    };
          * });
          */
         registerView: function(id, fac) {
            register(id, fac);
         },
         
         /**
          * Pushes the view specified by 'id' and makes the view active. Following are the steps:
          * <ol>
          *    <li>Find and create (if necessary from the supplied factory function) the view object</li>
          *    <li>If newly created, initialize the view by calling 'initialize(app) function</li>
          *    <li>Activate the view by calling the activate(data) function on the view object</li>
          *    <li>Transition the current view out of view port</li>
          *    <li>Deactivate the transitioned view on completion of the transition</li>
          * </ol>
          * 
          * @param {String} id The view id
          * @param {Object} viewData The data for the new view
          */
         showView: function(id, viewData) {
            pushView(id, viewData);
         },
         
         /**
          * Loads a remote view (in a different file) inside the view port and calls the specified
          * callback after the view is loaded
          * Experimental!!!
          * @param {String} id The view id
          * @param {String} url The url of the remote view
          * @param {Function} callback The callback function to call if the view loads successfully
          */
         loadView: function(id, url, callback) {
            if(views[id]) {
               callback(id);
               return;
            }
            $.xhr({
               url: url, 
               method: "GET", 
               dataType: "text", 
               success: function(content) {
                  var html = $(content), scripts = html.find("script"), view, exeScripts = [];
                  scripts.forEach(function(script) {
                     var scr = $(script), type = scr.attr("type");
                     if(!scr.attr("src") && (!type || type.indexOf("/javascript") !== -1)) {
                        html.remove(script);
                        exeScripts[exeScripts.length] = script;
                     }
                  });
                  
                  viewPort.append(html);
                  view = $("#" + id);
                  
                  forEach(exeScripts, function(script) {
                     var s = document.createElement("script");
                     s.textContent = script.textContent;
                     view.append(s);
                  });
                  
                  if(callback) {
                     callback(id);
                  }
               }
            });
         },
         
         /**
          * Pops the current view and restores the previous view. Following are the sequence of actions taken:
          * <ol>
          *    <li>Pop the current view from the stack</li>
          *    <li>Activate the last view on the stack by calling activate method on the view</li>
          *    <li>Transition the popped view out of the view port</li>
          *    <li>Transition the restored view into the view port</li>
          *    <li>After transition completes, deactivate the popped view</li>
          * </ol>
          * 
          * @param {Object} viewResult The data to provide to the restored view. This is passed to the activate() function
          */
         popView: function(viewResult) {
            popView(viewResult);
         },
         
         /**
          * Gets the id of the currently active view
          */
         getCurrentViewId: getCurrentViewId,
         
         /**
          * Starts this application loading the startView specified in the options.
          * The default value of startView is "main"
          */
         initialize: function(opts) {
            var port, body = window.document.body;
            options = $.extend({}, defaults, opts);
            port = options.viewPort;
            viewPort = port ? $("#" + port) : $(body);
            // show the start view
            pushView(options.startView);
         }
      };
      
      return app;
   };
   
   window.mojo = mojo;
})(window, h5);



