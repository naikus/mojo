/* global Application */
Application.addRoute("/about", {
  id: "aboutView",
  factory: function(App, viewUi) {
    var Events = Events = $.EventTypes;
    return {
      initialize: function() {
        $("#aboutBack").on(Events.tap, function() {
          App.popView();
        });
      },
      
      activate: function(routeParams, data) {
      },
      
      deactivate: function() {
      },
      
      destroy: function() {
      }
    };
  }
});