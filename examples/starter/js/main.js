Application.addRoute("/", {
   id: "mainView",
   factory: function(app, viewUi) {
      
      var types = ["info", "warn", "success", "error"];

      return {
         actions: [
            {
               type: "title",
               title: "Welcome"
            },
            {
               type: "action",
               alignment: "right",
               icon: "fa-info",
               handler: function() {
                  app.showView("/about");
               }
            }
         ],
         
         initialize: function() {
            $("#messageButton").on(Events.tap, function() {
               var type = types[Math.floor(Math.random() * 4)];
               Notification[type]("This is a random " + type + " message");
            });
         },

         activate: function(routeParams, data) {},
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});