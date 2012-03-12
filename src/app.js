(function(window, $) {
   "use strict";
   if(window.mojo) {
      return;
   }
   
   var mojo = {};
      
   mojo.App = function(opts) {
      var noop = function() {},
         defaults = {
            startView: "main"
         },
         options = $.extend({}, defaults, opts),
         views = {},
         viewStack = [],
         app;
         
      function ensureLifecycle(view) {
         view.init = view.init || noop;
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
      
      function pushView(id, data) {
         var nInfo = views[id], 
            nView, 
            nUi,
            current, 
            len = viewStack.length,
            cId = len ? viewStack[len - 1] : null;
         if(!nInfo) {
            throw new Error("No such view")
         }
         
         console.log("pushing: " + id);
         
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
         console.log("stack: " + viewStack.join(","));
      }
      
      function popView(data) {
         var nInfo, current;
         if(viewStack.length === 1) {
            console.log("Can't pop, last in stack");
            return;
         }
         current = views[viewStack.pop()];
         nInfo = views[viewStack[viewStack.length - 1]];
         
         console.log("popping: " + current.id + ", showing: " + nInfo.id);
         
         // deactivate the current view
         // current.view.deactivate();
         
         // activate the new view
         nInfo.view.activate(data);
         nInfo.ui.addClass("active");
         
         // transition the views
         setTimeout(function() {
            current.ui.removeClass("in").addClass("pop")
            nInfo.ui.removeClass("out").addClass("in");
         }, 40);
         
         console.log("stack: " + viewStack.join(","));
      }
      
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
         
         pushView: function(id, viewData) {
            pushView(id, viewData);
         },
         
         popView: function(viewResult) {
            popView(viewResult);
         },
         
         getCurrentViewId: function() {
            var len = viewStack.length;
            return len ? viewStack[len - 1] : null;
         },
         
         start: function() {
            this.pushView(options.startView);
         }
      };
      
      // $(window).on("hashchange", pushOrPopView);
      
      return app;
   };
   
   window.mojo = mojo;
})(window, h5)
