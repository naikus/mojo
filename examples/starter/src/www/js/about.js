Application.addRoute("/about", {
  id: "aboutView",
  factory: function(app, viewUi) {

    return {
      initialize: function() {
        $("#aboutBack").on(Events.tap, function() {
          app.popView();
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