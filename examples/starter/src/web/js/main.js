Application.addRoute("/", {
   id: "mainView",
   factory: function(app, viewUi) {
      
      var types = ["info", "warn", "success", "error"];

      return {
         actions: [
            {
               type: "title",
               title: "Starter App"
            },
            {
               type: "action",
               alignment: "right",
               icon: "fa-info",
               handler: function() {
                  app.showView("/about");
               }
            },
            {
               type: "action",
               alignment: "right",
               icon: "fa-bookmark",
               handler: function() {
                  app.showView("/form");
               }
            }
         ],
         
         initialize: function() {
            $("#messageButton").on(Events.tap, function() {
               var type = types[Math.floor(Math.random() * 4)];
               Notification[type]("This is a random " + type + " message", type === "error");
            });
         },

         activate: function(routeParams, data) {},
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});