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
   var mojo = {};
      
   mojo.App = function(opts) {
      var noop = function() {},
         // default application options, overriden in opts
         defaults = {
            startView: "main"
         },
         options = $.extend({}, defaults, opts),
         // all the views are stored here keyed by view ids
         views = {},
         // current views on the stack to manage transitions. This stores the view ids
         viewStack = [],
         // the applicatin object
         app;
         
      /**
       * Just ensures that all the lifecycle methods are available for the specified view object
       * If not adds them
       * @param view The view object
       */
      function ensureLifecycle(view) {
         view.initialize = view.initialize || noop;
         view.activate = view.activate || noop;
         view.deactivate = view.deactivate || noop;
         view.destroy = view.destroy || noop;
      }
      
      function indexOf(array, obj) {
         for(var i = 0, len = array.len; i < len && array[i] === obj; i++);
         return i === len ? -1 : i;
      }
      
      function getViewIndex(url) {
         var hash = url.lastIndexOf("#"), frag, idx;
         if(hash === -1) {
            return -1;
         }
         frag = url.substring(hash + 1);
         idx = Number(frag);
         return isNaN(idx) ? -1 : idx;
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
         var nInfo = views[id], 
            nView, 
            nUi,
            current, 
            len = viewStack.length,
            cId = len ? viewStack[len - 1] : null;
         if(!nInfo) {
            throw new Error("No such view: " + id);
         }
         
         // console.log("pushing view: " + id);
         
         nUi = nInfo.ui;
         
         // create and initialize new view if applicable
         nView = nInfo.view;
         if(!nView) {
            nView = nInfo.view = nInfo.factory(app, nUi);
            ensureLifecycle(nView);
            // initialize the newly created view
            nView.initialize(data);
         }
         
         // activate the new view
         nView.activate(data);
         nUi.addClass("active");
         
         // transition views
         setTimeout(function() {
            // transition out the old view, this is not the same as popping a view
            if(cId) {
               current = views[cId];
               // transition out the current view
               current.ui.addClass("out").removeClass("in");
            }
            // transition in the new view
            nUi.addClass("transition").addClass("in");
         }, 40);
         
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
         var nInfo, current, nui, len = viewStack.length;
         if(len === 1) {
            console.log("Can't pop, last in stack");
            return;
         }
         current = views[viewStack.pop()];
         nInfo = views[viewStack[len - 2]]; // because we popped, the last item is at len - 1 - 1 
         
         // console.log("popping: " + current.id + ", showing: " + nInfo.id);
         
         nui = nInfo.ui;
         
         // activate the new view
         nInfo.view.activate(data);
         nui.addClass("active");
         
         // transition the views
         setTimeout(function() {
            current.ui.removeClass("in").addClass("pop")
            nui.removeClass("out").addClass("in");
         }, 40);
         
         // console.log("view stack: " + viewStack.join(","));
      }
      
      /**
       * Handles some actions after views transition in or out of the view port
       */
      function handleViewTransition(evt) {
         var target = evt.target, el = $(target), viewId = target.id, view = views[viewId].view;
         if(el.hasClass("view")) {
            if(el.hasClass("out")) {
               view.deactivate();
               el.removeClass("active");
            }
            
            if(el.hasClass("pop")) {
               view.deactivate();
               el.removeClass("active").removeClass("transition").removeClass("pop");
            }
         }
      }
       
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
            var uiView, info, old = views[id];
            
            // check if this view is trying to register itself again
            old = views[id];
            if(old) {
               throw new Error("View " + id + " is already exists");
            }
            
            // see if the wrapper element for this view exists
            uiView = $("#" + id);
            if(!uiView.count()) {
               throw new Error("Wrapper element for view " + id + " not found");
            }
            
            //ensureLifecycle(view);
            
            // add transition handling listener
            uiView.on("transitionend", handleViewTransition)
               .on("webkitTransitionEnd", handleViewTransition)
               .on("OTransitionEnd", handleViewTransition);
            
            // maintain the state of this view in a secret :) object
            info = {
               id: id,
               ui: uiView,
               view: null,
               factory: fac
            };
            views[id] = info;
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
         pushView: function(id, viewData) {
            if(this.getCurrentViewId() === id) {
               return;
            }
            pushView(id, viewData);
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
         getCurrentViewId: function() {
            var len = viewStack.length;
            return len ? viewStack[len - 1] : null;
         },
         
         /**
          * Starts this application loading the startView specified in the options.
          * The default value of startView is "main"
          */
         start: function() {
            this.pushView(options.startView);
         }
      };
      
      // $(window).on("hashchange", pushOrPopView);
      
      return app;
   };
   
   window.mojo = mojo;
})(window, h5)



