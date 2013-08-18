/**
 * The event module. Provides methods to add, remove, delegate and fire events and othe convenicence
 * methods
 * @author aniketn3@gmail.com
 */
(function($) {
   var slice = $.slice,
      forEach = $.forEach,
      filter = $.filter,
      readyCalls = [],
      isTypeOf = $.isTypeOf,
      
      noop = function() {}, customEvents = {}, 
      defaultDefn = {
         setup: noop,
         destroy: noop,
         defaultAction: noop
      },
      
      isReady = false,
      eventStore,
      create = document.createEvent;
   
   /**
    * Wrapper for addEventListener and attachEvent
    */
   function addListener(elem, type, handler, capture) {
      if(elem.addEventListener) {
         elem.addEventListener(type, handler, capture || false);
      }else if(elem.attachEvent) {
         elem.attachEvent("on" + type, handler);
      }
   }

   /**
    * Wrapper for removeEventListener and detachEvent
    */
   function removeListener(elem, type, handler, capture) {
      if(elem.removeEventListener) {
         elem.removeEventListener(type, handler, capture || false);
      }else if(elem.detachEvent) {
         elem.detachEvent("on" + type, handler);
      }
   }
   
   /**
    * Fix the event to normalize accross browsers, espeically IE
    * http://www.quirksmode.org/js/events_properties.html was a great source of info
    */
   function fixEvent(evt, elem) {
      var e = evt || window.event, t = e.target, doc, body;
      e.preventDefault || (e.preventDefault = function() {this.returnValue = false;});
      e.stopPropagation || (e.stopPropagation = function() {this.cancelBubble = true;});
      
      if(!t) {
         t = e.target = e.srcElement || elem;
         e.currentTarget = elem; //ofcourse :D
      }
      
      // bug in safari? for text nodes
      if(t.nodeType === 3 ) {
         e.target = e.target.parentNode;
      }
      
      if(!e.relatedTarget && e.fromElement) {
         e.relatedTarget = e.fromElement === e.target ? e.toElement : e.fromElement;
      }
      
      // fix buttons
      if(!e.buttons) {
         e.buttons = e.button;
      }
      
      // positioning
      if(!e.pageX || !e.pageY) {
         if(e.clientX || e.clientY) {
            doc = e.target.ownerDocument || document;
            body = doc.body;
            e.pageX = e.clientX + body.scrollLeft;
            e.pageY = e.clientY + body.scrollTop;
         }
      }
   }
   
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
         
      if(create) {
         evt = document.createEvent("Events");
      }else if(document.createEventObject) {
         evt = document.createEventObject();
      }
      
      if(isTypeOf(props, "Object")) {
         for(prop in data) {
            if(prop !== "bubbles" && prop !== "cancelable") {
               evt[prop] = data[prop];
            }
         }
      }else {
         evt.data = props;
      }
      
      if(evt.initEvent) {
         evt.initEvent(type, bubbles, cancelable);
      }
      return evt;      
   }
   
   /**
    * Parses the event into an event and optional namespace
    * @param {String} evtType The event type string. This can be of the form 'click.mywidget'
    * @return {Object} An object with two properties type and ns. e.g. 'click.mywidget.foo' will be
    * parsed as {type: 'click', ns: 'mywidget.foo'}
    */
   function parse(evtType) {
      var arr = evtType.split(".");
      return {
         type: arr[0],
         ns: arr.slice(1).join(".")
      };
   }
   
   /**
    *
    * IEContentLoaded.js
    *
    * Author: Diego Perini (diego.perini@gmail.com) NWBOX S.r.l.
    * Summary: DOMContentLoaded emulation for IE browsers
    * Updated: 05/10/2007
    * License: GPL/CC
    * Version: TBD
    * 
    * @param {Window} w The wndow object
    * @param {Function} fn the callback function
    */
   function ieContentLoaded (w, fn) {
      var d = w.document, done = false,
      // only fire once
      init = function () {
         if (!done) {
            done = true;
            fn();
         }
      };
      // polling for no errors
      (function poll() {
         try {
            // throws errors until after ondocumentready
            d.documentElement.doScroll('left');
         } catch (e) {
            setTimeout(poll, 50);
            return;
         }
         // no errors, fire
         init();
      })();
      // trying to always fire before onload
      d.onreadystatechange = function() {
         if (d.readyState === 'complete') {
            d.onreadystatechange = null;
            init();
         }
      };
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
   
   /**
    * Event store provides API for creating, retrieving, deleting and storing
    * handler proxies.
    */
   eventStore = (function() {
      var handlers = {};
      
      function eid(elem) {
         return elem.__h5evtId || (elem.__h5evtId = "h5evt_" + $.uuid());
      }    
      
      function findHandler(arrH, type, listener, capture) {
         var handler, i, len, h;
         for(i = 0, len = arrH.length; i < len; i++) {
            h = arrH[i];
            if(h.listener === listener && h.capture === capture && h.type === type) {
               handler = h;
               break;
            }
         }
         return handler;
      } 
      
      return {
         /**
          * Creates a proxy handler for specified properties.
          * If the handler already exists, null is returned
          * @param elem {Node} The DOM element
          * @param type {String} The type of event e.g. 'click', 'mouseover.foo', etc.
          * @param listener {Function} The actual listener that will be call when the event is fired
          * @param capture {boolean} Whether to add during capturing or bubbling phase. false for bubbling
          * @return {Function} A newly created handler or null if one already exists for the same arguments
          */
         createHandler: function(elem, type, listener, capture) {
            var id = eid(elem), elemH = handlers[id] || (handlers[id] = []), 
            handler = findHandler(elemH, type, listener, capture),
            hArgs = slice(arguments, 4) || [],
            hFunc;
                    
            if(handler) {
               return null;
            }
             
            hFunc = function(e) {
               fixEvent(e, elem);
               hArgs.unshift(e);
               if(listener.apply(elem, hArgs) === false) {
                  e.stopPropagation();
                  e.preventDefault();
               }
            };
            hFunc.listener = listener;
            hFunc.type = type;
            hFunc.capture = capture || false;
            hFunc.elem = elem;
             
            elemH.push(hFunc);
            return hFunc;
         },

         /**
          * Deletes a proxy handler for specified properties.
          * @param elem {Node} The DOM element
          * @param type {String} The type of event e.g. 'click', 'mouseover.foo', etc.
          * @param listener {Function} The actual listener that was used to register for the event
          * @param capture {boolean} Whether this was added for capturing or bubbling phase. false for bubbling
          * @return {Function} The deleted handler or null
          */
         deleteHandler: function(elem, type, listener, capture) {
            var id = eid(elem), elemH = handlers[id], i, len, h, handler;
            if(!elemH) {
               return null;
            }
            capture = capture || false;
            for(i = 0, len = elemH.length; i < len; i++) {
               h = elemH[i];
               if(h.listener === listener && h.capture === capture && h.type === type) {
                  handler = h;
                  break;
               }
            }
            if(i < len) {
               elemH.splice(i, 1);
            }
            return handler;
         },
         
         /**
          * Gets all the proxy handlers with this store
          * @return {Array} An array of all the proxy handlers in this store or an empty array if
          * none were stored.
          */
         getAllHandlers: function() {
            var allH = [];
            forEach(handlers, function(arrH, eId) {
               allH = allH.concat(arrH);
            });
            return allH;
         },
         
         /**
          * Get all the handlers of the specified type registered with the
          * specified element
          */
         getHandlers: function(elem, type) {
            var id = eid(elem), elemH = handlers[id] || [];
            return filter(elemH, function(h) {
               return h.type === type;
            });
         }
      };
   })();
   
   
   $.extension({
      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to false
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @param {Object} data The extra information to be passed to callback when its called
       * @see $.capture(type, callback, data)
       */
      on: function(type, callback, data) {
         var evt = parse(type), domEvt = evt.type, elems = this.elements;
         setupCustomEvent(domEvt, elems);
         forEach(elems, function(elem) {
            var h = eventStore.createHandler(elem, type, callback, false, data);
            if(h) {
               addListener(elem, domEvt, h, false);
            }
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
         var evt = parse(type), domEvt = evt.type, elems = this.elements;
         destroyCustomEvent(domEvt, elems);
         forEach(elems, function(elem) {
            var h = eventStore.deleteHandler(elem, type, callback, capture);
            if(h) {
               removeListener(elem, domEvt, h, capture);
            }
         });
         return this;
      },

      /**
       * Adds an event listener, <tt>callback</tt> for the specified event on the current set of 
       * element(s). The capturing is set to true
       * @param {String} type The type of event "click", "mouseover", "mouseout", etc.
       * @param {Function} callback The callback function that will be called when the event is fired
       * on the current set of elements
       * @param {Object} data The extra information to be passed to callback when its called
       * @see $.on(type, callback, data)
       */
      capture: function(type, callback, data) {
         var evt = parse(type), domEvt = evt.type, elems = this.elements;
         setupCustomEvent(domEvt, elems);
         forEach(elems, function(elem) {
            var h = eventStore.createHandler(elem, type, callback, true, data);
            if(h) {
               addListener(elem, domEvt, h, true);
            }
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
            var evt = createEvent(type, data), arrh;
            if(elem.dispatchEvent) {
               elem.dispatchEvent(evt);
            }else if(elem.fireEvent) {
               try {
                  elem.fireEvent("on" + type, evt);
               }catch(e) {
                  console.log("Error firing event " + type + ": " + e.message);
                  arrh = eventStore.getHandlers(elem, type);
                  evt.type = type;
                  if(arrh.length > 0) {
                     forEach(arrh, function(h) {
                        h.call(elem, evt);
                     });
                  }
               }
            }
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
            definition.setup()
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
   
   (function init() {
      var h, attachEvent = document.attachEvent;
      if(document.addEventListener) {
         h = function() {
            document.removeEventListener("DOMContentLoaded", h, false);
            callReady();
         };
         document.addEventListener("DOMContentLoaded", h, false);
      }else if(attachEvent) {
         ieContentLoaded(window, callReady);
      }
      
      if(attachEvent && !document.removeEventListener) {
         window.attachEvent("onunload", function() {
            forEach(eventStore.getAllHandlers(), function(h) {
               $(h.elem).un(h.type, h.listener, h.capture);
            });
         });
      }
   })();
})(h5);



