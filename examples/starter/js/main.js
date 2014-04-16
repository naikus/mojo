Application.addRoute("/", {
   id: "mainView",
   factory: function(app, viewUi) {

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
         
         initialize: function() {},

         activate: function(routeParams, data) {},
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});