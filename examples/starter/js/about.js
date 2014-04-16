Application.addRoute("/about", {
   id: "aboutView",
   factory: function(app, viewUi) {

      return {
         actions: [
            {
               type: "action",
               alignment: "left",
               icon: "fa-left-big",
               handler: function() {
                  app.popView();
               }
            },
            {
               type: "title",
               title: "About Starter App"
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