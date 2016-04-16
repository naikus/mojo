/* global TechService, Application, Events */
Application.addRoute("/main", {
  id: "mainView",
  factory: function (App, viewUi) {
    var Notification = App.Notification,
        Navigation = App.Navigation;
    
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
        Navigation.registerAction("logout", function() {
          App.popView(null, "/login");
          // logout and reload the window
          // window.location.reload();
        });
                
        var self = this;
        viewUi.on("transitionin", function() {
          self.onTransitionIn();
        }).on("transitionout", function() {
          self.onTransitionOut();
        });
      },
      
      onTransitionIn: function() {
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
