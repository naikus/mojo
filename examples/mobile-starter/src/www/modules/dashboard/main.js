/* global TechService, Application, Events */
Application.addRoute("/main", {
  id: "mainView",
  factory: function (App, viewUi) {
    var Notification = App.Notification,
        Navigation = App.Navigation, 
        repeat;

    var navItems = [
      {icon: "icon-alarm", title: "ALARMS", route: "/main"},
      {icon: "icon-album-cover", title: "ALBUMS", route: "/main"},
      {icon: "icon-amd", title: "AMD", route: "/main"},
      {icon: "icon-exit", title: "LOGOUT", action: function() {App.popView(null, "/login");}}
    ];
    
    return {
      getActions: function() {
        return [
          {
            type: "action",
            icon: "icon icon-menu",
            handler: function () {
              Navigation.toggle();
            }
          },
          {type: "title", title: "DASHBOARD"}
        ];
      },
      
      initialize: function () {
        Navigation.setItems(navItems);
        
        repeat = $("#repeat").repeat({});
        repeat.onItem($.EventTypes.tap, function(e, data) {
          var el = $(data.element);
          if(el.hasClass("selected")) {
            el.removeClass("selected");
          }else {
            el.addClass("selected");
          }
        });
        repeat.onItem($.EventTypes.taphold, function(e, data) {
          Notification.info("Taphold");
          Notification.alert("Taphold");
        });
                
        var self = this;
        viewUi.on("transitionin", function() {
          self.onTransitionIn();
        }).on("transitionout", function() {
          self.onTransitionOut();
        });
      },
      
      onTransitionIn: function() {
        var items = ["One", "Two", "Three", "Four", "Five", "Six", "Seven"];
        repeat.prependItem(items, true);
      },
      
      onTransitionOut: function() {
      },
      
      activate: function (routeParams, viewData) {
      },
      
      deactivate: function () {
      },
      
      onBackButton: function() {
        Notification.confirm(
            "Do you want to exit?",
            function(val) {
              if(val === 2) {
                (navigator.app && navigator.app.exitApp());
              }
            },
            "Exit", ["No", "Yes"]
        );
      },
      
      destroy: function () {
      }
    };
  }
});
