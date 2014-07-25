/*!
 * The MIT License
 * 
 * Copyright (c) 2011-2013 h5 Authors. All rights reserved.
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
 * @fileOverview h5 is a compact and lightweight html5 library 
 * @author <a href="mailto:aniket3@gmail.com">Aniket Naik</a>
 */
(function(global) {
   "use strict";
   if(global.h5 && global.$) {
      return;
   }
   
   var undef,
      AProto = Array.prototype,
      OProto = Object.prototype,
      
      slice = AProto.slice,
      nSlice = slice,
      objToString = OProto.toString,

      doc = global.document, 
      huid = 1,
      h5;

   /* ------------------------------- Utility functions ---------------------------------------- */
    
   /**
    * Console logging API that just about works accross browsers. The log messages are ignored
    * if no logging feature is available in the browser
    */
   if(typeof global.console === "undefined") {
      global.console = (function() {
         var log = global.opera ? global.opera.postError : function() {};
         return {
            log: log
         };
      })();
   }
   
   /**
    * Creates a new object whose prototype is the specified object
    * @param {Object} objFrom The object to extend from
    */
   function createObject(objFrom) {
      if(Object.create) {
         return Object.create(objFrom);
      }
      function F() {}
      F.prototype = objFrom;
      return new F();
   }
   
   /**
    * Gets the type of object specified. The type returned is the [[Class]] internal property
    * of the specified object. For build in types the values are:
    * -----------------------------------------------------------
    * String  
    * Number  
    * Boolean 
    * Date    
    * Error   
    * Array   
    * Function
    * RegExp  
    * Object  
    *
    * @param {Object} that The object/function/any of which the type is to be determined
    */
   function getTypeOf(that) {
      // why 8? cause the result is always of pattern '[object <type>]'
      return objToString.call(that).slice(8, -1); 
   }
   
   function isTypeOf(that, type) {
      return objToString.call(that).slice(8, -1) === type;
   }
    
   function hasOwn(obj, prop) {
      if(obj.hasOwnProperty) {
         return obj.hasOwnProperty(prop);
      }else {
         var val = obj[prop];
         return typeof val !== "undefined" && obj.constructor.prototype[prop] !== val;
      }
   }
   
   function isFunction(that) {
      return objToString.call(that) === "[object Function]";
   }
   
   function isArray(that) {
      return objToString.call(that) === "[object Array]";
   }
   
   function sliceList(start, end)  {
      var arr, i, 
              /* jshint validthis:true */
              len = this.length, 
              s = start || 0, e = end || len;
      /* jshint validthis:true */
      if(isArray(this)) {
         /* jshint validthis:true */
         arr = nSlice.call(this, s, e);
      }else {
         // so that we can have things like sliceList(1, -1);
         if(e < 0) { 
            e = len - e;
         }
         arr = [];
         for(i = s; i < e; i++) {
            arr[arr.length] = this[i];
         }
      }
      return arr;
   }
    
   function uuid() {
      return huid++;
   }
   
   function trim(s) {
      return s.replace(/(^\s+)|\s+$/g, "");
   }   
    
   // normalize the slice function
   (function() {
      try {
         slice.call(doc.getElementsByTagName("html")); // this fails below IE9
      }catch(err) {
         console.log("Array slice does not work on array-like objects, using custom slice");
         slice = sliceList;
      }
   })();
   
   /* ---------------------------- iteration functions ------------------------------------------ */
   
   /**
    * Iterates over the array (or arraylike or object) <tt>arr</tt> and calls the <tt>callback</tt>
    * for each iteration with the scope as <tt>thisObject</tt>. Uses the native forEach if its
    * available on the specified array or obejct.
    * @param {Object|Array} arr The array or object to iterate, if the object specified is an array
    * its elements are iterated, if the object is a "object" its values and keys are iterated
    * @param {Function} callback The callback function to call for each iteration. If an array is
    * iterated, the callback is called as <tt>callback(val, index, array)</tt> else the callback
    * is called as <tt>callback(value, key, obj)</tt>
    * @param {Object} thisObj An optional scope object that will be the value of "this" inside
    * the callback
    * @function
    */  
   function forEach(arr, callback, thisObj) {
      var o = Object(arr), each = arr.forEach, key;
      if(each && isFunction(each)) {
         arr.forEach(callback, thisObj);
      }else {
         if(isArray(o)) {
             for(var i = 0, len = o.length; i < len; i++) {
                 callback.call(thisObj, o[i], i, arr);
             }
         }else {
            for(key in o) {
               if(hasOwn(o, key)) {
                  callback.call(thisObj, o[key], key, arr);
               } 
            }
         }
      }
   }
    
   /**
    * Iterates over the array (or arraylike or object) <tt>arr</tt> and calls the <tt>callback</tt>
    * for each iteration with the scope as <tt>thisObject</tt> collecting or filtering objects for 
    * which the callback returns true. Uses the native <tt>Array.filter</tt> if its available on 
    * the specified array or obejct
    * @param {Object|Array} arr The array or object to iterate, if the object specified is an array
    * its elements are iterated, if the object is a "object" its values and keys are iterated
    * @param {Function} callback The callback function to call for each iteration. If an array is
    * iterated, the callback is called as <tt>callback(val, index, array)</tt> else the callback
    * is called as <tt>callback(value, key, obj)</tt>
    * @param {Object} thisObj An optional scope object that will be the value of "this" inside
    * the callback
    * @return An array of filtered objects
    * @function
    */
   function filter(arr, callback, thisObj) {
      var o = Object(arr), fil = arr.filter, ret;
      if(fil && isFunction(fil)) {
         return o.filter(callback, thisObj);
      }else {
         ret = [];
         forEach(arr, function(val, idx, arr) {
            if(callback.call(thisObj, val, idx, arr)) {
               ret[ret.length] = val;
            }
         });
         return ret;
      }
   }
   
   /**
    * Calls the <tt>callback</tt> function for each of the items in the array/obj <tt>arr</tt> and
    * returns the values returned by callback for each of these in an array
    */
   function map(arr, callback, thisObj) {
      var ret = [];
      forEach(arr, function(val, i, arr) {
         if(typeof val !== "undefined") {
            var retVal = callback.call(thisObj, val, i, arr);
            if(retVal !== null && typeof retVal !== "undefined") {
               ret[ret.length] = retVal;
            }
         }
      });
      return ret;
   }
    
    
   /**
    * Extends the target object from multiple sources
    */
   function shallowCopy(/*target, source0, souce1, souce2, ... */) {
      var target = arguments[0], sources = slice.call(arguments, 1);
      forEach(sources, function(src) {
         for(var k in src) {
            target[k] = src[k];
         }
      });
      return target;
   }

    
   /* ------------------------------- The nodelist ---------------------------------------------- */
   h5 = (function() {
      // var htmlRe = /^\s*<(!--)?\s*(\w+)[^>]*>/,
      var htmlRe = /^\s*<(!--\s*.*)?(\w+)[^>]*>/,
      isIe = !!window.ActiveXObject,
      table = doc.createElement("table"),
      tbody = doc.createElement("tbody"),
      tr = doc.createElement("tr"),
      div = doc.createElement("div"),

      hasqsa = !! doc.querySelectorAll,
      selEngine = global.selectorEngine,

      containers = {
         "*": div,
         // table: table,
         tbody: table,
         tfoot: table,
         tr: tbody,
         td: tr,
         th: tr
      },
            
      /**
       * The prototype for all our objects returned by $(...) or h5(...)
       */
      h5Proto;

      function fragments(html, tgName) {
         var c, ret, children, tag;
         if(!tgName) {
            ret = htmlRe.exec(html);
            tgName = ret ? ret[2] : null;
         }
         c = containers[tgName] || div;
         if(isIe) {
            tag = c.tagName.toLowerCase();
            if(tag === "tbody" || tag === "table" || tag === "thead" || tag === "tfoot") {
               return getFrags("table", html, true);
            }
         }
         c.innerHTML = "" + html;
         children = c.childNodes;
         return slice.call(children);
      }
        
      function elAndSel(s, c) {
         var ret = {
            e: [], 
            s: ""
         }, execRes, qr;
         if(!s) {
            return ret;
         }else if(isTypeOf(s, "String")) {
            s = trim(s);
            if((execRes = htmlRe.exec(s)) !== null) {
               ret.e = fragments(s, execRes[2]);
            }else {
               if(hasqsa) {
                  qr = c.querySelectorAll(s);
               }else if(selEngine) {
                  qr =  selEngine(s, c);
               }else {
                  throw new Error("No selector engine found. Set custom engine via global selectorEngine property");
               }
               ret.e = slice.call(qr);
               ret.s = s;
            }
         }else if(s.elements) { // h5 object
            ret.e = s.elements;
            ret.s = s.selector;
         }else if(s.nodeName) { // dom element
            ret.e = [s];
         }else if(s.length) { // array or nodelist
            ret.e = slice.call(s);
         }else if(s === global) {
            ret.e = [s];
         }
         return ret;
      }
        
      function getFrags(nodeName, html, isTable) {
         var frags;
         html += "";
         div.innerHTML = ["<", nodeName, ">", html, "</", nodeName, ">"].join("");
         frags = isTable ? div.firstChild.firstChild.childNodes : div.firstChild.childNodes;
         return frags;
      }

      h5Proto = {
         /**
          * Gets the element at the specified index in this nodelist
          * @param {Number} idx The index of the element to get
          * @return {Node} The element or node at the specified index or null
          *
          * @memberOf nodelist
          */
         get: function(idx)   {
            return this.elements[idx];
         },
            
         count: function() {
            return this.elements.length;
         },
            
         /**
          * Finds the element(s) matching the specified selector within the context of the current
          * element (this can be null, then it works just like $(...))
          * @param {String} selector The selector of the elements to find
          * @return {Object} the $ object matched for chaining
          * @example
          * var pees = $("#foo").find("p"); // finds all the "p" elements under the element with id "foo"
          * // This finds the span element in element in the html and sets its content to stupid
          * $("&lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;cruel&lt;/span&gt; world&lt;/p&gt;").find("span").html("stupid");
          * // Will result in 
          * &lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;stupid&lt;/span&gt; world&lt;/p&gt;
          */
         find: function(selector)   { 
            var elements = this.elements, res = [];
            if(elements.length === 0) return nodelist(selector);
            for(var i = 0, len = elements.length; i < len; i++) {
               var elem = elements[i], nt = elem.nodeType;
               if(nt === 1 || nt === 9 || nt === 11) {
                  var found = nodelist(selector, elem).elements;
                  if(found.length) {
                     res = res.concat(found);
                  }
               }
            }
            return nodelist({elements: res});
         },
            
         /**
          * Calls the <tt>callback</tt> function for each element that is the part of this object
          * The callback is called as callback(each-element, index, element-array). The value of
          * this inside the callback function refers to the <tt>ctx</tt> argument or if not passed,
          * the global object
          * @param {Function} callback The callback function to call for each element
          * @param {Object} ctx The optional objec that becomes "this" inside the callback
          * @example
          * // Adds css class 'foo' to all the elements that also have 'para' css class and sets 
          * // their innerHTML to 'Bar'
          * $(".para").forEach(function(elem, i) {
          *   $(elem).addClass("foo").html("Bar");
          * });
          */
         forEach: function(callback, ctx) {
            forEach(this.elements.slice(0), callback, ctx || global);
            return this;
         },
            
         /**
          * Calls the <tt>callback</tt> function for each element that is the part of this object
          * and returns those objects as array for which the callback returns true.
          * The callback is called as callback(each-element, index, element-array). The value of
          * this inside the callback function refers to the <tt>ctx</tt> argument or if not passed,
          * the global object
          * @param {Function} callback The callback function to call for each element
          * @param {Object} ctx The optional objec that becomes "this" inside the callback
          * @example
          * // Gets all the elements with 'para' css class and returns an array of only those
          * // that have inner HTML as "Baz"
          * $(".para").forEach(function(elem, i) {
          *   return $(elem).html() === "Baz";
          * });
          */
         filter: function(callback, ctx) {
            return filter(this.elements.slice(0), callback, ctx || global);
         }
      };
        
      /**
       * This is the main entry point of h5. This can be called with a selector, h5 object,
       * DOM object(s) or array of object/dom nodes
       */
      function nodelist(sel, ctx) {
         ctx = ctx ? ctx.elements ? ctx.elements[0] : ctx : doc;
         var elemSel = elAndSel(sel, ctx), h5 = createObject(h5Proto);
         h5.elements = elemSel.e;
         h5.selector = elemSel.s;
         h5.context = ctx;
         return h5;
      }
        
      // Expose useful utility functions
      nodelist.forEach = forEach;
      nodelist.filter = filter;
      nodelist.map  = map;
      nodelist.isArray = isArray;
      nodelist.getTypeOf = getTypeOf;
      nodelist.isTypeOf = isTypeOf;
      nodelist.slice = function(arrayLike, start, end) {
         return slice.call(arrayLike, start, end);
      };
      nodelist.trim = String.prototype.trim ? function(str) {return str.trim();} : function(str) {return trim(str);};
      nodelist.shallowCopy = shallowCopy;
      nodelist.getFragments = fragments;
      nodelist.uuid = uuid;
      nodelist.createObject = createObject;
      nodelist.hasOwn = hasOwn;
        
      /**
       * Expose a extension API to extend 
       */
      nodelist.extension = function(/* [name, extFunc] | object */) {
         var extnObj = arguments[0], extFunc = arguments[1], name = extnObj, 
         arg1Type = getTypeOf(extnObj);      
            
         if(arg1Type === "String") {
            if(h5Proto[name]) {
               console.log("Warning! Extension " + name + " is already defined");
            }
            if(!extFunc) {
               console.log("Extension value not provided for " + name);
               return;
            }
            h5Proto[name] = extFunc;
         }else if(arg1Type === "Object") {
            forEach(extnObj, function(valFunc, key) {
               if(isFunction(valFunc)) {
                  nodelist.extension(key, valFunc);
               }
            });
         }
      };
        
      return nodelist;
   })();
    
   global.h5 = global.$ = h5;
    
})(this);




/**
 * The event module. Provides methods to add, remove, delegate and fire events and othe convenicence
 * methods
 * @author aniketn3@gmail.com
 */
(function($) {
   var forEach = $.forEach,
      isTypeOf = $.isTypeOf,
      
      noop = function() {}, customEvents = {}, 
      defaultDefn = {
         setup: noop,
         destroy: noop,
         defaultAction: noop
      },
      
      readyCalls = [],
      isReady = false;
      
   /**
    * Creates and initializes an event.
    * @param {String} type The type of the event e.g. mouseout, click, etc.
    * @param {Object} props The properties for the event. This can be an object that sets other properties
    * for this event or any string or any other object. If the props is an object, its properties are
    * assigned to the event object. If its a String or any other object, props is assigned to event.data
    * property.
    * @return the newly created and initialized (initEvent) event.    
    */
   function createEvent(type, props) {
      var evt, data = props || {},
         prop,
         bubbles = data.bubbles === false ? false : true,
         cancelable = data.cancelable === false ? false : true;   
         evt = document.createEvent("Events");

      if(isTypeOf(props, "Object")) {
         for(prop in data) {
            if(prop !== "bubbles" && prop !== "cancelable") {
               evt[prop] = data[prop];
            }
         }
      }else {
         evt.data = props;
      }      
      evt.initEvent(type, bubbles, cancelable);
      return evt;      
   }
   
   function callReady() {
      if(isReady) {
         return;
      }
      isReady = true;
      forEach(readyCalls, function(fun) {
         fun.call(window);
      });
      readyCalls = null;
   }
   
   function setupCustomEvent(type, elems) {
      var eData = customEvents[type], defn, count;
      if(!eData) {return;}
      
      count = eData.count;
      if(!count) { // setup this custom event
         defn = eData.definition;
         defn.setup();
      }
      eData.count += elems.length;
   }
   
   function destroyCustomEvent(type, elems) {
      var eData = customEvents[type], defn, count;
      if(!eData || !eData.count) {return;}
      
      eData.count -= elems.length;
      if(!eData.count) {
         defn = eData.definition;
         defn.destroy();
      }
   }
   
   (function init() {
      var h = function() {
            document.removeEventListener("DOMContentLoaded", h, false);
            callReady();
      };
      if(document.addEventListener) {
         document.addEventListener("DOMContentLoaded", h, false);
      }
   })();
      
   $.extension({
      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to false
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @see $.capture(type, callback)
       */
      on: function(type, callback) {
         var elems = this.elements;
         setupCustomEvent(type, elems);
         
         forEach(elems, function(elem) {
            elem.addEventListener(type, callback, false);
         });
         return this;
      },
      
      /**
       * Removes the specified event listener from the current set to elements if they were previously
       * registered.
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that was added previously
       * @param {boolean} capture Whether the callback was registered for capturing or bubbling phase
       */
      un: function(type, callback, capture) {
         var elems = this.elements;
         destroyCustomEvent(type, elems);
         forEach(elems, function(elem) {
            elem.removeEventListener(type, callback, capture || false);
         });
         return this;
      },
      
      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to true
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @see $.on(type, callback)
       */
      capture: function(type, callback) {
         var elems = this.elements;
         setupCustomEvent(type, elems);
         forEach(elems, function(elem) {
            elem.addEventListener(type, callback, true);
         });
         return this;
      },
      
      /**
       * Dispatches the specified event on the current selected element(s)
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Object} data The event data such as "button", "relatedTarget", etc for the event. If 
       * the data argument is not an object, its set into the property data.event
       */
      dispatch: function(type, data) {
         forEach(this.elements, function(elem) {
            var evt = createEvent(type, data);
            return elem.dispatchEvent(evt);
         });
         return this;
      }
   });
   
   /**
    * The DOM ready function, This will be called as soon as possible when the DOM content of the
    * document is available.
    * @param callback {Function} The callback function to call as when DOM is ready.
    */
   $.ready = function(callback) {
      if(isReady) {
         callback.call(window);         
      }else {
         readyCalls.push(callback);
      }
   };

   /**
    * Defines a custom event. The definition is specified by the definition object described below
    * @param definition The definition object for this custom event. This object has following
    * properties and methods:
    *
    * type: The custom event that is being defined. This is optional if you are defining multiple events at a time.
    * 
    * setup: Function to call when you want to set up your custom handling mechanism. This is called only once. If
    * the 'type' property is defined, this function is called when the first event listener for this event is added
    * to an element. If the 'type' property is not defined. The setup function is called when DOM content becomes 
    * available, specifically in $.ready().
    *
    * destroy: Function to cleanup the custom event. This is also called only once. If the 'type' property is
    * defined, its called when the last event listener is removed for this custom event, and if the 'type' is not
    * defined, its called on unload of the document    
    * 
    * @example
    * <pre>
    * $.defineEvent({
    *    type: "bigbang",        // The custom event type you are defining. 
    *    setup: function() {     // The code to setup event
    *       
    *    }, 
    *    destroy: function() {   // The code to cleanup
    *    
    *    }  
    * });  
    * </pre>
    * 
    * @see See touch.js for a concrete example
    */
   $.defineEvent = function(definition) {
      var eData, defn, type;
      
      type = definition.type;
      if(!type) { // this is unmanaged eager definition, probably defining multiple custom events
         $.ready(function() {
            definition.setup();
         });
         $(document).on("unload", function() {
            definition.destroy();
         });
         return;
      }
      eData = customEvents[type];
      if(eData) {
         defn = eData.definition;
         defn.destroy();
         console.log("Event " + type + " is already defined, overwriting!");
      }else {
         customEvents[type] = {
            type: type,
            count: 0,
            definition: $.shallowCopy({}, defaultDefn, definition)
         };
      }
   };
})(h5);




/**
 * The DOM manipulation module. This provides various convenience methods for working with DOM and
 * css
 * @author aniketn3@gmail.com
 */
(function($) {
   var undef,
      gcs = window.getComputedStyle,
      fragments = $.getFragments,
      slice = $.slice,
      forEach = $.forEach,
      isTypeOf = $.isTypeOf,
      isArray = $.isArray,
      getTypeOf = $.getTypeOf,
      trim = $.trim,
      splAttrs = { // thanks jquery :-)
         tabindex: "tabIndex",
         readonly: "readOnly",
         "for": "htmlFor",
         "class": "className",
         maxlength: "maxLength",
         cellspacing: "cellSpacing",
         cellpadding: "cellPadding",
         rowspan: "rowSpan",
         colspan: "colSpan",
         disabled: "disabled",
         checked: "checked",
         usemap: "useMap",
         frameborder: "frameBorder",
         contenteditable: "contentEditable"
      },
      clsRegExps = {};
     
   /*
    * Removes all the children of the specified element using DOM APIs
    * This is used as a fallback method instead of setting innerHTML as "" as this fails in
    * some versions of IE browsers
    */
   function removeAllDom(elem) {
      // In a few cases in IE, the innerHTML of a table is a read only property
      // thats why we have to use dom 
      var child = elem.firstChild;
      while(child)   {
         elem.removeChild(child);
         child = elem.firstChild;
      }
      return elem;
   }
   
   function removeAll(elem, useDom)   {
      if(useDom) {
         return removeAllDom(elem);
      }
      try {
         elem.innerHTML = "";
      }catch(e) {
         return removeAllDom(elem);
      }
      return elem;
   }
     
   function isNodeList(that) {
      if(!that) {
         return false;
      }
      var thatType = getTypeOf(that);
      return thatType === "NodeList" || thatType === "HTMLCollection" || (that.item && (that.length !== undef));
   }
   
   function classRe(clazz) {
      // new RegExp("\\b" + clazz + "[^\w-]")
      return clsRegExps[clazz] || (clsRegExps[clazz] = 
            new RegExp("(^|\\s+)" + clazz + "(?:\\s+|$)")); // thank you xui.js :) 
   }
     
   /*
    * Converts the <tt>html</tt> which can be an HTML string, a nodelist or a node, then passes the
    * converted html and the specified <tt>element</tt> to the callback as:
    * <tt>callback(element, arrnodesFromhtml)</tt>.
    * The idea is borrowed from turing.js framework (https://github.com/alexyoung/turing.js) but with
    * some modifications. If the element is a table element, then the callback is passed a tbody, if
    * present or the table element
    */
   function domify(element, html, callback)  {
      var nodeName = element.nodeName.toLowerCase(), htmType = getTypeOf(html),
      isTable = (nodeName === "table" || nodeName === "tbody" || nodeName === "thead" || nodeName === "tfoot"),
      cbElem, frags;
      
      if(htmType === "String" || htmType === "Number") {
         frags = fragments(html);
      }else if(html.nodeName) { // dom node
         frags = [html];
      }else if(html.elements) { // h5 object
         frags = html.elements;
      }else if(isArray(html) || isNodeList(html)) { // array or nodelist
         frags = html;
      }else {
         frags = fragments(html);
      }
         
      // if its table, pass in the tbody, else pass in the element
      cbElem = isTable ? (element.getElementsByTagName("tbody")[0] || element) : element;      
      callback(cbElem, slice(frags));
   }
   
   function append(elem, html) {
      domify(elem, html, function(appendTo, arrNodes) {
         for(var i = 0, len = arrNodes.length; i < len; i++)  {
             appendTo.appendChild(arrNodes[i]);
         }
      });
   }
   
   function replace(elem, html) {
      domify(elem, html, function(appendTo, arrNodes) {
         appendTo = removeAll(appendTo);
         append(appendTo, arrNodes);
      });
   }
   
   function hasClass(elem, clName) {
      return classRe(clName).test(elem.className);
   }
   
   function addClass(elem, clName) {
      var cList = elem.classList;
      if(!cList || !clName) {
         return false;
      }
      cList.add(clName);
      return true;
   }
   
   function removeClass(elem, clName) {
      var cList = elem.classList;
      if(!cList || !clName) {
         return false;
      }
      cList.remove(clName);
      return true;
   }
   
   function data(elem, prop, val) {
      var arglen = arguments.length, dmap = elem.datamap || (elem.datamap = {});
      if(arglen === 1)  {
         return dmap;
      }else if(arglen === 2) {
         return dmap[prop];
      }else {
         //dmap = elem.datamap = elem.datamap || {};
         dmap[prop] = val;
         return null;
      }
   }
      
   function setAttributes(elem, attrs) {
      forEach(attrs, function(val, key) {
         var spl = splAttrs[key], n = spl || key;
         if(spl) {
            elem[n] = val; // @TODO: should this be $(elem).val(val) in case of n === "value"?
         }else {
            elem.setAttribute(key, val);
         }
      });
   }
     
   $.extension({
      /**
       * Gets or sets the html string as inner html to all the elements in the current matched 
       * elements. If call without arguments, returns the html contents of the first element in
       * current matched elements.
       * @param {String} markup The html to set (Optional)
       * @return {String} The html contents of the matched element if called without any arguments
       * or the nodelist objec for chaining
       *
       * @memberOf nodelist
       */
      html: function(markup)  {
         var elements = this.elements, ret, isStr;
         if(arguments.length === 0) {
            return $.map(elements, function(el) {
               return el.innerHTML;
            }).join("");
         }
         
         markup = markup == null ?  "" : markup;
         isStr = isTypeOf(markup, "String");
         
         for(var i = 0, len = elements.length; i < len; i++) {
             var elem = elements[i];
             if(isStr) {
               try {
                  elem.innerHTML = markup;
               }catch(e)   {
                  replace(elem, markup);
               }
            }else {
               replace(elem, markup);
            }
         }
         return this;
      },
              
      children: function(selector) {
         var empty = [], ret, thisElem;
         if(!this.elements.length) {
            return empty;
         }
         if(!selector || getTypeOf(selector) === "String") {
            thisElem = this.elements[0];
            ret = $(selector || "*", thisElem);
            return $.filter(ret.elements, function(el) {
               return el.parentNode === thisElem;
            });
         }
         return empty;
      },
         
      /**
       * Gets or sets an attribute of the matched element(s). If <tt>value</tt> is specified, 
       * the attribute is set with that value, else the value of the attribute is returned
       * @param {String} name The attribute name
       * @param {String} value The value to set
       * @return {String} the value of the attribute if called with <tt>name</tt> else the nodelist
       * for chaining
       *
       * @memberOf nodelist
       */
      attr: function(name, value) {
         var spl = splAttrs[name], n = spl || name, elements = this.elements, ntype = typeof name, i, len = elements.length; 
         if(!len)  {
            return value ? this : null;
         }

         if(arguments.length === 1) {
            if(ntype === "string") {
               if(spl) {
                  return elements[0][n];
               }
               // getAttribute fails in older versions of safari ipod touch 3.1.2
               return elements[0].getAttribute ? elements[0].getAttribute(name) : elements[0][name];
            }else {
               for(i = 0, len = elements.length; i < len; i++) {
                   setAttributes(elements[i], n);
               }
               return this;
            }
         }else {
            if(spl) {
               for(i = 0; i < len; i++) {
                   elements[i][n] = value;
               }
            }else {
               for(i = 0; i < len; i++) {
                   elements[i].setAttribute(name, value);
               }
            }
            return this;
         }
      },
         
      /**
       * Gets or sets the value of a form element (the "value" attribute). If called with 1 argument,
       * the value is set or else the value is retrieved
       * @param {String} theVal The value to set
       * @return {String} The value of the input or form field if called without any arguments else 
       * the nodelist object for chaining
       *
       * @memberOf nodelist
       */             
      val: function(theVal)   {
         var n, opts, opt, vals, opv, el, ret, elem, elements = this.elements, i, j, k, len = elements.length, rlen;
         if(!len) {
            return theVal ? this : null;
         }

         if(arguments.length === 1) {
            for(i = 0; i < len; i++) {
               elem = elements[i];
               n = elem.nodeName.toLowerCase();
               if(n === "select") {
                  opts = $("option", elem).elements;
                  vals = isTypeOf(theVal, "Array") ? theVal : [theVal];
                         
                  elem.selectedIndex = -1;
                  
                  var val;
                  for(j = 0; j < vals.length; j++) {
                      val = vals[j];
                      try {
                        for(k = 0; k < opts.length; k++) {
                            opt = opts[k];
                            opv = opt.value || opt.innerHTML;
                            if(opv === val) {
                               opt.selected = "selected";
                               break;
                            }
                        } // for k
                     }catch(breakExp) {}
                  } // for j
               }else {
                  elem.value = theVal;
               }
            }// for
            return this;
         }else {
            el = elements[0];
            n = el.nodeName.toLowerCase();
            if(n === "select") {
               ret = [];
               opts = $("option", el).elements;
               for(i = 0; i < opts.length; i++) {
                  opt = opts[i];
                  if(opt.selected) {
                     opv = opt.value || opt.innerHTML;
                     ret[ret.length] = opv;
                  }
               }                     
               rlen = ret.length;
               return rlen === 0 ? "" : rlen === 1 ? ret[0] : ret;
            }else {
               return el.value;
            }
         }
      },

      /**
       * Gets or sets the custom data on matched element(s). Uses HTML5 datasets if available
       * @param {String} name The name of data property
       * @param {Object} value The value of the property
       * @return {Object} The value of the property if called with ony 1 argument else the nodelist
       * object for chaining
       *
       * @memberOf nodelist
       */
      data: function(name, value)   { 
         var len = arguments.length, elements = this.elements;
         if(elements.length === 0)  {
            return null;
         }
         
         if(len === 1)  {
            return data(elements[0], name);
         }else {
            for(var i = 0; i < elements.length; i++) {
                data(elements[i], name, value);
            }
         }
         return this;
      },
         
      /**
       * Appends the html content (node, or html string) to the first matched element.
       * @param {String|Node} html The html content to append
       * @return {Object} the same nodelist for chaining
       */
      append: function(html)  {
         var elements = this.elements;
         if(!html || !elements.length) {
            return this;
         }
         append(elements[0], html);
         return this;
      },
         
      /**
       * Prepends the html to the first matched element in this context (nodelist)
       * @param {String|Node} html The html content to prepend (insertbefore)
       * @return {Object} the nodelist object for chaining
       */
      prepend: function(html) {
         var elements = this.elements;
         if(!html || !elements.length) {
            return this;
         }
         domify(elements[0], html, function(theElem, arrNodes) {
            var child, node, i;
            // while prepending, go backwards to maintain order :)
            for(i = arrNodes.length - 1; i >= 0; i--) {
               child = theElem.firstChild;
               node = arrNodes[i];
               if(child)  { 
                  theElem.insertBefore(node, child);
               }else {
                  theElem.appendChild(node);
               }
            }
         }); 
          
         return this;
      },
      
      before: function(html) {
         var elems = this.elements;
         if(!html || !elems.length) {
            return this;
         }
         domify(elems[0], html, function(theElem, arrNodes) {
            var node, i, parent = theElem.parentNode;
            // while inserting before, go backwards to maintain order :)
            for(i = arrNodes.length - 1; i >= 0; i--) {
               node = arrNodes[i];
               parent.insertBefore(node, theElem);
            }
         });
         return this;
      },
         
      /**
       * Removes all the elements matching the selector from this context (nodelist)
       * @param {String|Node|HTML|NodeList|ArrayOfNodes} selector The CSS selector for the element(s) 
       * to match
       * @example
       * // Given element 
       * &lt;p id="bar" class="foo baz"&gt;Hello &lt;span&gt;stupid&lt;/span&gt; world&lt;/p&gt;
       * $("#bar").remove("span");
       * // will result in
       * &lt;p id="bar" class="foo baz"&gt;Hello world&lt;/p&gt;
       */
      remove: function(/* selector */) {
         var sel, elems = this.elements, e, len = elems.length, i,
               remover = function(re) {
                  var n = re.parentNode;
                  return n ? n.removeChild(re) : null;
               };
         if(!arguments.length) {
            for(i = 0; i < len; i++) {
                e = elems[i];
                e.parentNode.removeChild(e);
            }
            // this.elements = [];
         }else if(elems.length) {
            sel = arguments[0];
            for(i = 0; i < len; i++) {
               $(sel, elems[i]).forEach(remover);
            }
         }
         return this;
      },
         
      /**
       * Determines whether the current matched element has the specified class in its className
       * @param {String} cl The class name to check
       * @return true if the current element has the specified class
       * @example
       * // given element
       * &lt;p id="mypara" class="para info"&gt;Hello&lt;/p&gt;
       * // this returns true
       * $("#mypara").hasClass(info); // true
       */
      hasClass: function(cl) {
         var elems = this.elements;
         return elems.length && hasClass(elems[0], cl);
      },
         
      /**
       * Adds a CSS class <tt>cl</tt> to the current matched element
       * @param {String} cl The class to add
       * @return {Object} The nodelist object for chaining
       * @example
       * // Given the element
       * &lt;p id="mypara" class="foo baz"&gt;Hello&lt;/p&gt;
       * $("#mypara").addClass("bar") 
       * // will result in 
       * &lt;p id="mypara" class="foo baz bar"&gt;Hello&lt;/p&gt;
       */
      addClass: function(cl)  {
         var elements = this.elements, len = elements.length;
         for(var i = 0; i < len; i++) {
            var el = elements[i];
            if(!hasClass(el, cl) && !addClass(el, cl)) {
               el.className += " " + cl;
            }
         }
         return this;
      },
         
      /**
       * Removes a class <tt>cl</tt> from the current matched element's className
       * @param {String} cl The class to remove
       * @return {Object} The nodelist object for chaining
       * @example
       * // Given the element
       * &lt;p id="mypara" class="foo bar baz"&gt;Hello&lt;/p&gt;
       * $("#mypara").removeClass("bar") 
       * // will result in 
       * &lt;p id="mypara" class="foo baz"&gt;Hello&lt;/p&gt;
       */
      removeClass: function(cl)  {
         var elements = this.elements, len = elements.length;
         for(var i = 0; i < len; i++) {
            var el = elements[i];
            if(hasClass(el, cl) && !removeClass(el, cl)) {
               el.className = trim(el.className.replace(classRe(cl), "$1"));
            }
         }
         return this;
      },
         
      /**
       * Gets the value of the current or computed style property <tt>prop</tt> of the currently 
       * matched element
       * @param {String} prop The style property whose value is desired
       * @return {String} the value of the specified property or blank string
       * @example 
       * // Gets the background-color property of the element with id "foo"
       * var bgcolor = $("#foo").getStyle("backgroundColor");
       */
      getStyle: function(prop)   {
         var elements = this.elements, cs, elem;
         if(elements.length === 0) {return "";}
         
         elem = elements[0];
         if(gcs)  {
            cs = gcs(elem, null);
         }else {
            cs = elem.currentStyle;
         }
         return cs[prop];
      },
         
      /**
       * Sets the css style properties <tt>props</tt> for all the matched elements
       * @param {Object} props The style properties to set
       * @param {Object} value The property value if <tt>props</tt> is property name
       * @return {Object} the nodelist object chaining
       * @example
       * // This will set the border and background-color style properties all input elements
       * $("input").setStyle({
       *    "backgroundColor": "#666", // note the css property is a javascript version
       *    "border": "1px solid #333"
       * });
       */
      setStyle: function(props, value)  {
         var type = getTypeOf(props), elements = this.elements, len = elements.length, elem, style;
         for(var i = 0; i < len; i++) {
            elem = elements[i];
            style = elem.style;
            if(type === "Object") {
               for(var key in props) {
                  style[key] = props[key];
               }
            }else if(props === "String") {
               style[props] = value || "";
            }
         }
         return this;
      },
      
      css: function(prop, val) {
         var style, elements = this.elements, len = elements.length, elem;
         if(getTypeOf(prop) === "Object") {
            style = $.map(prop, function(v, k) {
               return k + ":" + v;
            }).join(";");
         }else {
            style = prop + ":" + val;
         }
         
         for(var i = 0; i < len; i++) {
            elem = elements[i];
            var s = elem.style, oldCss = s.cssText;
            if(oldCss) {
               s.cssText = oldCss + ";" + style;
            }else {
               s.cssText = style;
            }            
         }
      },
         
      /**
       * Gets the offset {top,letf,width,height} of the currently matched element
       * @return {Object} the offset object with properties top, left, width, height for the
       * currently matched element or null, if no matched elements exist.
       * @example
       * // This alert the actual offsets of the element with id "myelem"
       * var o = $("#myelem").offsets();
       * alert(["top: ", o.top, ", left: ", o.left, ", width: ", o.width, ", height: ", o.height].join(""));
       */
      offsets: function() {
         var elements = this.elements, elem, o, par;
         if(elements.length) {
            elem = elements[0];
            o = {
               top: elem.offsetTop,
               right: 0,
               bottom: 0,
               left: elem.offsetLeft,
               width: elem.offsetWidth,
               height: elem.offsetHeight
            };
            par = elem.offsetParent;

            while(par)  {
               o.left += par.offsetLeft;
               o.top += par.offsetTop;
               par = par.offsetParent;
            }
            return o;
         }
         return null;
      }
   });
         
})(h5);




/**
 * Defines custom events for touch related gusters.
 * Following events are defined:
 * tap, dbltap, taphold, swipe, swipeleft, swiperight
 * @author aniketn3@gmail.com 
 */

/**
 * Tap event definition
 */
(function($, undefined) {
   var state = {/* id, x, y, target */};
   
   function clearState() {
      state.id = state.x = state.y = state.moved = state.target = undefined;
   }
   
   function hasMoved(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2;
      return Math.abs(dx) > 15 || Math.abs(dy) > 15;
   }
   
   function handler(te) {
      var type = te.type, touch, touches = te.touches, cTouches = te.changedTouches, target = te.target;
      switch(type) {
         case "touchstart":
            if(touches.length !== 1) {
               return;
            }
            touch = touches[0];
            state.id = touch.identifier;
            state.x = touch.pageX;
            state.y = touch.pageY;
            state.target = target;
            break;
         case "touchmove":
            touch = cTouches[0];
            if(!state.moved && touch.identifier === state.id) {
               state.moved = hasMoved(state.x, state.y, touch.pageX, touch.pageY);
            }
            break;
         case "touchend":
            if(cTouches.length === 0 || state.moved) {
               clearState();
               return;
            }
            touch = cTouches[0];
            if(touch.identifier === state.id && !state.moved &&
                  // !hasMoved(state.x, state.y, touch.pageX, touch.pageY) &&
                  state.target === target) {
               $(target).dispatch("tap");
            }
            break;
         case "touchcancel":
            clearState();
            break;
      }
   }
      
   $.defineEvent({
      type: "tap",
      setup: function() {
         $(document).on("touchstart", handler).on("touchmove", handler)
            .on("touchend", handler).on("touchcancel", handler);
      },
      destroy: function() {
         $(document).un("touchstart", handler).un("touchmove", handler)
            .un("touchend", handler).un("touchcancel", handler);
      }
   });
})(h5);


/**
 * Double Tap event definition
 */
(function($, undefined) {
   var state = {/* last, target */};

   function handler(te) {
      var now = Date.now(), elapsed = now - (state.last || now), target = te.target;
      if(elapsed > 0 && elapsed < 300 && state.target === target) {
         $(target).dispatch("dbltap");
         state.last = state.target = null;
      }else {
         state.last = now;
         state.target = te.target;
      }
   }
      
   $.defineEvent({
      type: "dbltap",
      setup: function() {
         $(document).on("tap", handler);
      },
      destroy: function() {
         $(document).un("tap", handler);
      }
   });
})(h5);


/**
 * Tap hold event
 */
(function($, undefined) {
      var state = {/* moved, x, y */}, timer;
   
   function hasMoved(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2;
      return Math.abs(dx) > 20 || Math.abs(dy) > 20;
   }
   
   function clearState() {
      state.moved = state.x = state.y = undef;
   }
   
   function handler(te) {
      var type = te.type, target = te.target;
      switch(type) {
         case "touchstart":
            if(te.touches.length !== 1) {
               return;
            }            
            state.x = te.pageX;
            state.y = te.pageY;
            timer = setTimeout(function() {
               if(!state.moved) {
                  $(target).dispatch("taphold");
               }
            }, 700);
            break;
         case "touchmove":
            if(!state.moved) {
               if(state.moved = hasMoved(state.x, state.y, te.pageX, te.pageY)) { // jshint ignore:line
                  clearTimeout(timer);
               }
            }
            break;
         case "touchend":
         case "touchcancel":
            /* falls through */
         default:
            clearTimeout(timer);
            clearState();
            break;
      }
   }
   
   $.defineEvent({
      type: "taphold",
      setup: function() {
         $(document).on("touchstart", handler).on("touchmove", handler).on("touchend", handler)
            .on("touchcancel", handler);
      },
      destroy: function() {
         $(document).un("touchstart", handler).un("touchmove", handler).un("touchend", handler)
            .un("touchcancel", handler);
      }
   });
})(h5);


/**
 * Swipe event
 */
(function($, undefined) {
   var state = {};
   
   /**
    * Calculate the delta difference between two points (x1,y1) and (x2,y2)
    * @return A delta object {x: xdelta, y: ydelta} if the difference is more
    * than 30 pixels or null if its less. The values x and y can be -ve 
    */
   function getMovement(x1, y1, x2, y2) {
      var dx = x1 - x2, dy = y1 - y2, xa, ya;
      if((xa = Math.abs(dx)) < 30 & (ya = Math.abs(dy)) < 30) {
         return null;
      }
      return {
         startX: x2,
         startY: y2,
         endX: x1,
         endY: y1,
         dir: xa >= ya ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down") 
      };
   }
   
   function clearState() {
      state.id = state.x = state.y = state.movement = undef;
   }
   
   function handler(te) {
      var type = te.type, touches = te.touches, touch, target, m, evtData;
      
      switch(type) {
         case "touchstart":
            touches = te.touches;
            if(touches.length > 1) {
               return;
            }
            touch = touches[0];
            state.id = touch.identifier;
            state.x = touch.pageX;
            state.y = touch.pageY;
            break;
         case "touchmove":
            touches = te.changedTouches;
            touch = touches[0];
            if(touch.identifier === state.id && te.touches.length === 1) {
               state.movement = getMovement(touch.pageX, touch.pageY, state.x, state.y);
            }
            break;
         case "touchend":
            touches = te.changedTouches;
            touch = touches[0];
            if(state.id === touch.identifier && (m = state.movement)) {
               evtData = {movement: m};
               $(te.target).dispatch("swipe", evtData); // available as event.movement
               clearState();
            }
            break;
         default:
            clearState();
            break;
      }
   }
   
   $.defineEvent({
      type: "swipe",
      setup: function() {
         $(document).on("touchstart", handler).on("touchmove", handler).on("touchend", handler)
            .on("touchcancel", handler);
      },
      destroy: function() {
         $(document).un("touchstart", handler).un("touchmove", handler).un("touchend", handler)
            .un("touchcancel", handler);
      }
   });
})(h5);




/**
 * Convenience wrapper around XMLHttpRequest
 * @author aniketn3@gmail.com
 */
(function($) {
   var forEach = $.forEach,
      // isTypeOf = $.isTypeOf,
      getTypeOf = $.getTypeOf,
      slice = $.slice,
      noop = function() {},
      xmlhttp = window.XMLHttpRequest,
      doc = $(document), // for global ajax events
      uuid = $.uuid,  
      mimeTypes = {
         json: "application/json",
         xml:  "application/xml",
         html: "text/html",
         text: "text/plain"
      },
      
      /**
       * Data handlers convert data to the expected type when a response is received
       * from the server
       */
      handlers = {
         xml: function(req) {
            var rDoc = req.responseXML, root = rDoc.documentElement;
            if(root && root.nodeName === "parseerror") {
               throw new Error("parseerror");
            }
            return rDoc;
         },
         json: function(req) {
            var resTxt = req.responseText;
            if(resTxt) {
               return JSON.parse(req.responseText);
            }
            return "";
         },
         text: function(req) {
            return req.responseText;
         }
      },
      
      /**
       * The default ajax properties
       */
      xDefaults = {
         url: window.location.href,
         method: "GET",
         async: true,
         data: null,
         dataType: "text",
         //timeout: -1,
         headers: {
            "Content-Type": "application/x-www-form-urlencoded"
         },
         success: noop,
         error: noop
      };
      
   function dispatch(evt, data) {
      try {
         doc.dispatch(evt, data);
      }catch(e) {
         console.log("Error dispatching ajax event: " + e.message);
      }
   }
      
   function jsonp(url, success) {
      var jpId = "_jsonp" + uuid(), script,
         source = url.replace("callback=?", "callback=" + jpId)
            .replace("jsonp=?", "jsonp=" + jpId),
         handler = function() {
            // dispatch an ajax start event
            dispatch("ajaxend", url);
            success.apply(null, slice(arguments));
         };
      window[jpId] = handler;
      // dispatch an ajax start event
      dispatch("ajaxstart", url);
      script = $(document.createElement("script")).attr({src: source, type: "text/javascript"});
      $("head").append(script);
   }
      
   function xhr(options) {
      var req, opt = $.shallowCopy({}, xDefaults, options), url = opt.url, dType = opt.dataType, 
         data = opt.data, postData, mime = mimeTypes[dType] || "text/plain";
         
      // dispatch ajax start event on document
      dispatch("ajaxstart", url);
      
      req = xmlhttp ? new XMLHttpRequest({mozSystem: true}) : new ActiveXObject("Microsoft.XMLHTTP");
      if(opt.username) { 
         req.open(opt.method, url, opt.async, opt.username, opt.password);
      }else {
         req.open(opt.method, url, opt.async);
      }
      
      if(data) {
         // req.setRequestHeader("Content-Type", opt.contentType);
         req.setRequestHeader("Accept", mime);
      }
      req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      if(opt.headers) {
         forEach(opt.headers, function(v, k) {
            req.setRequestHeader(k, v);
         });
      }
      
      req.onreadystatechange = function() {
         var state = req.readyState, code, err, data, handler;
         if(state === 4) {
            code = req.status;
            if((code >= 200 && code < 400) || code === 0) {
               dispatch("ajaxsuccess", url);
               handler = handlers[dType] || handlers.text;
               try {
                  data = handler(req);
               }catch(error) {
                  console.log("Error parsing ajax response: " + error);
                  err = error;
               }
               if(err) {
                  opt.error(err, req);
               }else {
                  opt.success(data, req);
               }
            }else {
               dispatch("ajaxerror", {data: {url: url, status: code}});
               opt.error(code, req);
            }
            
            // dispatch an ajax complete event on document
            dispatch("ajaxend", url);
         }
      };
      
      postData = data || null;
      req.send(postData);
   }
   
   /**
    * Makes an XMLHttpRequest with the options specified.
    * @param {Object} options The options for this request. The options object can contain the
    * following properties
    *
    * <pre>
    * url         (String)     The url to make the ajax request     (window.location.href)
    * method      (String)     The HTTP method (GET|POST|HEAD)      ("GET")

    * async       (boolean)    Whether to make an async request     (true)
    * data        (DOM|Object|String) The data to send with request (null)
    * dataType    (String)     The expected resultent dataType      
    *                          ("xml"|"text"|"json")                (null)
    * username    (String)     Optional username if required        (null)
    * password    (String)     Optional password if required        (null)
    * timeout     (Number)     The time in milliseconts to wait     (currently not used)
    *                          for response                         (-1 indefinite)
    * headers     (Object)     Various headers as key:value         ({})
    *
    * success     (function)   The (optional) handler thats called on successful
    *                          completion of request. options.success(data, xhr-object)
    *
    * error       (function)   The (optional) handler thats called when an error occurs during
    *                          ajax request. options.error(code | error, xhr-object)
    * </pre>
    * @function
    */
   $.xhr = xhr;
   
   /**
    * Makes a JSONP request
    * @param {String} url The url to make a call. Must be of the format http://domain/somepath?callback=?
    * @param {Function} success The success handler
    */
   $.jsonp = jsonp;
   
   /**
    * An alias for $.xhr;
    */
   $.ajax = xhr;
   
   /**
    * A convenience function to GET data from server
    * @param {String} url The url to get data from
    * @param {Function} success The function thats called when ajax succeeds
    * @param {Function} error The function thats called when ajax has an error
    * All the other parameters are set to default
    */
   $.get = function(url, success, error) {
      xhr({url:url, success: success, error: error});
   };
   
   /**
    * A convenience function to POST the data to the server
    * @param {String} url The url to get data from
    * @param {Object} Options for this post request
    */
   $.post = function(url, opts) {
      var opt = $.shallowCopy(opts, {url: url, method: "POST"});
      xhr(opt);
   };
   
   /**
    * An alisa to $.ajax({url:url, success:success, dataType:"json"}); 
    * @param {String} url The url to get data from
    * @param {Function} success The function thats called when ajax succeeds
    * @param {Function} error The function thats called when ajax encounters an error
    */
   $.getJson = function(url, success, error) {
      var opt = {url: url, success: success, dataType: "json"};
      if(getTypeOf(error) === "Function") {
         opt.error = error;
      }
      xhr(opt);
   };
   
   /**
    * Allows to load the contents of the specified url into this element.
    */
   $.extension("load", function(url, selector, success) {
      var elems = this.elements, me = this, sel = selector, callback = success;
      if(typeof sel === "function") {
         callback = selector;
         sel = null;
      }
      
      if(elems.length > 0) {
         xhr({
            url: url, 
            success: function(data, req) {
               me.html(sel ? $(document.createElement("div")).html(data).find(sel) : data);
               if(callback) {
                  callback(data, req);
               }
            }
         });
      }
      return this;
   });
})(h5);