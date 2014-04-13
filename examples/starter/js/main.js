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
               icon: "fa fa-info-circle",
               handler: function() {
                  app.loadView("views/about.html", "/about");
               }
            }
         ],
         
         initialize: function() {
         },

         activate: function(routeParams, data) {
         },
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});