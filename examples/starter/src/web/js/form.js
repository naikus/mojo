Application.addRoute("/form", {
   id: "formView",
   factory: function(app, viewUi) {
      var buildings = ["T", "U", "V", "W", "X"],
            
            flats = ["001", "002", "003", "004",
                     "101", "102", "103", "104",
                     "201", "202", "203", "204",
                     "301", "302", "303", "304",
                     "401", "402", "403", "404",
                     "501", "502", "503", "504",
                     "601", "602", "603", "604"
            ],
            formBinder;
    
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
               alignment: "left",
               title: "Form"
            }
         ],
         
         initialize: function() {
            // viewUi.find(".toolbar").actionbar();
            
            // data binder for this form
            formBinder = viewUi.binder({
               
            });
            
            var buildingExpandable = $("#building").expandable();
            // list of lats
            var buildingList = $("#buildingList").datalist({
               itemClass: "activable",
               data: buildings
            });
            buildingList.on(Events.tap, function(e, uiItem, item) {
               formBinder.update("building", item);
               buildingExpandable.expand(false);
            });
            
            // expanding panel
            var flatExpandable = $("#flat").expandable();
            
            // list of lats
            var flatList = $("#flatList").datalist({
               itemClass: "activable",
               data: flats
            });
            flatList.on(Events.tap, function(e, uiItem, item) {
               formBinder.update("flat", item);
               flatExpandable.expand(false);
            });

            
            
            // save button
            $("#btnSave").on(Events.tap, function() {
               Notification.alert(JSON.stringify(formBinder.getModel(), null, " "));
            });
         },

         activate: function(routeParams, data) {
         },
         
         deactivate: function() {},
         
         destroy: function() {}
      };
   }
});