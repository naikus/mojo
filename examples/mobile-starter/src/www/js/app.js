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
  return this;
});

$.extension("toggleClass", function(name) {
  this.forEach(function(el){
    var elem = $(el);
    if(elem.hasClass(name)){
      elem.removeClass(name);
    }else{
      elem.addClass(name);
    }
  });
  return this;
});

$.extension("removeAttr", function(name) {
  this.forEach(function(el){
    if(el.hasAttribute(name)){
      el.removeAttribute(name);
    }
  });
  return this;
});


// Global navigation
(function($, undefined) {
  $.extension("navigation", function(App) {
    var self = this,
        EventTypes = $.EventTypes,
        nav = self.find(".nav"),
        navList = self.find(".nav-list").repeat();

    navList.onItem(EventTypes.tap, function(e, data) {
      var li = $(data.element),
          model = data.item,
          route = li.get(0).getAttribute("data-route");
      hide(function() {
        if(route) {
          App.showView(route);
          return;
        }
        var handler = model.action;
        if(handler) {
          handler(model, li);
        }
      });
    });

    // hide main menu if container is tapped
    self.on(EventTypes.tap, function(e) {
      hide();
    });

    function show() {
      self.addClass("show");
      setTimeout(function() {
        nav.addClass("in");
      }, 50);
    }

    function hide(callback) {
      nav.removeClass("in");
      self.removeClass("show");
      setTimeout(function() {
        if(callback) {
          callback();
        }
      }, 300);
    }

    return {
      toggle: function() {
        if(self.hasClass("show")) {
          hide();
        }else {
          show();
        }
      },
      setItems: function(items) {
        navList.setItems(items);
      },
      isShowing: function() {
        return self.hasClass("show");
      }
    };
  });
})(h5);


// Actionbar plugin
(function($, undefined) {
  $.extension("actionbar", function(App) {
    // Global toolbar
    var EventTypes = $.EventTypes,
        // actTemplate = $.template('<span class="icon {icon}"></span> {title}'),
        actionBarContainer = this,
        actionBar = actionBarContainer.find("ul").repeat({
          render: function(li, i, action) {
            action.id = action.id || "action_" + $.uuid();
            li.attr("data-id", action.id)
                .addClass(action.type || "action")
                .addClass(action.alignment || "left");
            if(action.cssClass) {
              action.cssClass.split(" ").forEach(function(c) {
                li.addClass(c);
              });
            }
            if(typeof action.render === "function") {
              action.render.call(action, li);
            }
          }
        });

    actionBar.onItem(EventTypes.tap, function(e, data) {
      $.StopEvent(e);
      setTimeout(function() {
        var element = data.element, action = data.item, handler = action.handler;
        if(typeof handler === "function") {
          handler.call(null, element, action);
        }
      }, 100);
    });

    // On iOS and other devices to prevent the click event
    var doc = $(document);
    doc.on("deviceready", function() {
      if(window.device.platform === "iOS") {
        doc.capture("focus", function(e) {
          var target = e.target, name = target.nodeName;
          name = name ? name.toLowerCase() : name;
          if(name === "input" || name === "select" || name === "textarea") {
            (!actionBarContainer.hasClass("absolute") && actionBarContainer.addClass("absolute"));
          }
        }).capture("blur", function(e) {
          actionBarContainer.removeClass("absolute");
        });
      }
    });

    App.getViewPort().on("beforeviewtransitionin", function() {
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
        return actionBarContainer.find("[data-id=" + id + "]");
      }
    };
  });
})(h5);


function HideKeyboard() {
  // $("#hideKeyboard").get(0).focus();
  var elem = document.activeElement;
  if(elem && elem !== document.body && typeof elem.blur === "function") {
    elem.blur();
  }
}


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
      transitionDelay: 150,
      // startView: "/"
      // transitionProperty: "opacity",
      routes: window.APP_ROUTES
    });

    App.Notification = $("#notifications").notifications();
    App.DialogManager = $("#dialogPane").dialogmanager();
    App.Navigation = $("#navContainer").navigation(App);
    App.ActionBar = $("#globalActionBar").actionbar(App);

    App.getViewPort().on("beforeviewtransitionout", function() {
      HideKeyboard();
    });


    // Called on android when back button is pressed (android back button)
    doc.on("backbutton", function() {
      if(App.Navigation.isShowing()) {
        App.Navigation.toggle();
        return;
      }

      var route = App.getCurrentRoute(),
          controller = route.controller,
          path = route.path;

      if(typeof controller.onBackButton === "function") {
        controller.onBackButton();
      }else {
        App.popView();
      }
    });



    // infinite scroll on document to notify views
    function handleScroll() {
      if(vPort.hasClass("view-transitioning")) {
        return;
      }
      var innerHeight = window.innerHeight,
          currRoute = App.getCurrentRoute(),
          ui, contentHeight, scrollTop;

      if(!currRoute) {return;}

      ui = App.getCurrentRoute().ui;
      contentHeight = ui.get(0).offsetHeight;
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
