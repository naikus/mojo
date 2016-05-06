/* global TechService, Application, Events */
Application.addRoute("/main", {
  id: "mainView",
  factory: function (App, viewUi) {
    var Notification = App.Notification,
        Navigation = App.Navigation, 
        repeat;
    
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
        
        repeat = $("#repeat").repeat({});
        repeat.onItem($.EventTypes.tap, function(e, data) {
          var el = $(data.element);
          if(el.hasClass("selected")) {
            el.removeClass("selected");
          }else {
            el.addClass("selected");
          }
        });
                
        var self = this;
        viewUi.on("transitionin", function() {
          self.onTransitionIn();
        }).on("transitionout", function() {
          self.onTransitionOut();
        });
      },
      
      onTransitionIn: function() {
        var items = [];
        for(var i = 0; i < 10; i += 1) {
          items.push({
            fname: "Firstname_" + i,
            lname: "Lastname_" + i
          });
        }
        repeat.setItems(items);
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
