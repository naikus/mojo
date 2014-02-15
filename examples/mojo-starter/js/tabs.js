Application.addRoute("/tabs", {
   id: "tabView",
   factory: function(app, viewUi) {

      var uiList, uiListItemTemplate, mainTab;

      return {
         initialize: function() {
            // configure the toolbar
            viewUi.find(".toolbar").actionbar({
                refresh: function() {
                   Messages.info("Refreshing...");
                },
                logout: function() {
                   if(window.confirm("Log out?")) {}
                }
            });

            // list item rendering template
            uiListItemTemplate = $("#uiListItemTemplate").template();

            // list widget
            uiList = $("#uiList").datalist({
               selectable: true,
               itemClass: "activable",
               render: function(list, item, i, itemModel) {
                  item.html(uiListItemTemplate.process(itemModel))
               }
            });

            var arrItems = [];
            for(var i = 0; i < 20; i++) {
               arrItems[arrItems.length] = {
                  title: "Item " + (i + 1), 
                  description: "Description for Item " + (i + 1)
               };
            }
            uiList.setItems(arrItems);

            uiList.on(Events.tap, function(e, item, itemModel) {
               Messages.info(itemModel.description);
            });

            // tabstrip widget
            mainTab = $("#mainTab").tabstrip({
               ontabchange: function(currTab, oldTab) {
                  // Messages.info("Tab selected: " + this.getSelectedIndex());
               }
            });
            
            var toggle = $("#toggles").find(".toggle").toggle();
            toggle.on("change", function(e) {
               Messages.info("Value is " + e.value + " at " + e.index);
            });
            
            $("#expandPanel").expandable();
         },

         activate: function(routeParams, data) {
         }
      };
   }
});