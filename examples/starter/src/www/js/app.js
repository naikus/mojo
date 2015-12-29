/* global h5 */
/*
 * Array.indexOf polyfill (for IE 8 and others)
 * Taken from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
 */
(function() {
  if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement /*, fromIndex */) {
      "use strict";
      if(this == null) {
        throw new TypeError();
      }
      var t = Object(this);
      var len = t.length >>> 0;
      if(len === 0) {
        return -1;
      }
      var n = 0;
      if(arguments.length > 1) {
        n = Number(arguments[1]);
        if(n != n) { // shortcut for verifying if it's NaN
          n = 0;
        }else if(n != 0 && n != Infinity && n != -Infinity) {
          n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
      }
      if(n >= len) {
        return -1;
      }
      var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
      for(; k < len; k++) {
        if(k in t && t[k] === searchElement) {
          return k;
        }
      }
      return -1;
    };
  }
})();



$.extension("once", function(eventType, callback) {
  var self = this, onceCall = function onceCall() {
    self.un(eventType, onceCall);
    callback.apply(self, arguments);
  };
  this.on(eventType, onceCall);
});



// Global navigation
(function($, undefined) {
  $.extension("navigation", function(App) {
    var self = this,
        EventTypes = $.EventTypes,
        nav = self.find(".nav-list").datalist({
          itemClass: "activable",
          selectable: false,
          template: $.template([
            // '<div id="{id}" class="nav-item">',
              '<span class="inline-box title">{title}</span>',
              '{summary}'
            // '</div>'
          ].join(""))
        }),
        actions = {
          back: function(toView) {
            App.popView(null, toView);
          },
          toggle: function() {
            if(self.hasClass("show")) {
              self.removeClass("show");
            }else {
              self.addClass("show");
            }
          }
        };

    nav.on(EventTypes.tap, function(e, li, model) {
      window.setTimeout(function() {
        var route = li.attr("data-route");
        if(route) {
          App.showView(route);
          return;
        }
        var action = li.attr("data-action");
        var handler = actions[action];
        if(handler) {
          handler(li, model);
        }
      }, 300);
    });

    // hide main menu if container is tapped
    self.on(EventTypes.tap, function(e) {
      window.setTimeout(function() {
        self.removeClass("show");
      }, 50);
    });

    return {
      toggle: function() {
        actions.toggle();
      },
      registerAction: function(name, handler) {
        actions[name] = handler;
      },
      isShowing: function() {
        return self.hasClass("show");
      }
    };
  });
})(h5);



(function($, undefined) {
  $.extension("actionbar", function(App) {
    // Global toolbar
    var EventTypes = $.EventTypes, 
        actTemplate = $.template('<span class="icon {icon}"></span> {title}'),
        actionBarContainer = this,
        actionBar = actionBarContainer.datalist({
          selectable: false,
          listClass: "",
          itemClass: "",
          render: function(actionBar, li, i, action) {
            action.id = action.id || "action_" + $.uuid();
            li.attr("id", action.id);
            li.addClass("activable")
                .addClass(action.cssClass || "")
                .addClass(action.type || "action")
                .addClass(action.alignment || "left");
            return actTemplate.process(action);
          }
        });
        
    actionBar.on(EventTypes.tap, function(e, item, action) {
      var handler = action.handler;
      if(typeof handler === "function") {
        handler.call(null, item, action);
      }
    });

    App.getViewPort().on("viewtransitionin", function() {
      var route = App.getCurrentRoute(), 
          controller = route.controller,
          actions = typeof controller.getActions === "function" ?
              controller.getActions() : controller.actions;
              
      actionBar.setItems(actions);
      if(actions && actions.length) {
        actionBarContainer.removeClass("hide");
      }else {
        actionBarContainer.addClass("hide");
      }
    });
    
    return {
      getAction: function(id) {
        return actionBarContainer.find("#" + id);
      }
    };
  });
})(h5);




/* ------------------------------- Application Code And Initialization ---------------------------------------- */

(function(window, $, undefined) {
  // set the default user action event (tap in touch enabled browsers or fallback to click
  var doc = $(document), App = $.Application();
  window.Application = App;
  
  // enable touch activable using the mojo activables plugin
  doc.activables();
  
  // initialize our application on ready ------------------------------------------------------------
  $.ready(function() {
    var vPort = $("#viewPort");

    // set up loading
    var loading = $("#loading");
    doc.on("ajaxstart", function() {
      loading.addClass("show");
    }).on("ajaxend", function() {
      loading.removeClass("show");
    });
        
    // initialize our app
    App.initialize({
      viewPort: vPort,
      loadFromPath: false,
      enableHashChange: false, //if set to true, drops the framerate in chrome by half :(
      transitionDelay: 200,
      // startView: "/"
      // transitionProperty: "opacity",
      routes: [
        {path: "/calendar",           viewPath: "views/calendar.html"},
        {path: "/time",               viewPath: "views/time.html"},
        {path: "/select-server",      viewPath: "views/select-server.html"},
        {path: "/login",              viewPath: "views/login.html"},
        {path: "/main",               viewPath: "views/main.html"},
        {path: "/about",              viewPath: "views/about.html"}
      ]
    });
    
    
    App.Notification = $("#notifications").notifications();
    App.DialogManager = $("#dialogPane").dialogmanager();
    App.Navigation = $("#navContainer").navigation(App);
    App.ActionBar = $("#globalActionBar").actionbar(App);
    


    // Called on android when back button is pressed (android back button)
    doc.on("backbutton", function() {
      if(App.Navigation.isShowing()) {
        App.Navigation.toggle();
        return;
      }

      var path = App.getCurrentRoute().path;
      if(path === "/login") {
        return navigator.app.exitApp();
      }

      if(path === "/main") {
        if(navigator.app) {
          navigator.notification.confirm("Do you want to exit?",
              function(val) {
                if(val === 2) {
                  navigator.app.exitApp();
                }
              },
              "Exit", ["No", "Yes"]);
        }
        return;
      }else {
        App.popView();
      }
    });
    
    
      
    // infinite scroll on document to notify views
    // infinite scroll on document to notify views
    function handleScroll() {
      if(vPort.hasClass("view-transitioning")) {
        return;
      }
      var innerHeight = window.innerHeight,
          ui = App.getCurrentRoute().ui,
          contentHeight = ui.get(0).offsetHeight,
          scrollTop = document.body.scrollTop;
      if(contentHeight - scrollTop === innerHeight) {
        console.log([contentHeight, scrollTop, innerHeight].join(" "));
        ui.dispatch("scrolledtobottom");
      }
    }
    doc.on("scroll", function() {
      window.requestAnimationFrame(handleScroll);
    });


    doc.on("deviceready", function() {
      window.open = cordova.InAppBrowser.open;
      window.setTimeout(function() {
        navigator.splashscreen && navigator.splashscreen.hide();
      }, 2000);
    });

    // show root view
    App.showView("/login");
  });

})(window, h5);
