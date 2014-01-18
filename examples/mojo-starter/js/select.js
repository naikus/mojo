Application.addRoute("/ui/select", {
   id: "selectListView",
   factory: function(app, viewUi) {
      var selectList, selectListTitle, itemTemplate, listData;
      return {
         initialize: function() {
            // configure the toolbar
            viewUi.find(".toolbar").actionbar();

            selectListTitle = $("#selectListTitle");
            selectList = $("#selectList").datalist({
               selectable: true,
               itemClass: "activable",
               render: function(widget, item, itemIdx, objItem) {
                  if(itemTemplate) {
                     return itemTemplate.process({
                        list: widget,
                        item: item,
                        index: itemIdx,
                        model: objItem
                     });
                  }else {
                     return "" + objItem;
                  }
               },
               onselectionchange: function(objVal) {
                  if(objVal) {
                     app.popView({
                        id: listData.id,
                        selection: objVal,
                        index: selectList.getSelectedIndex()
                     });
                  }
               }
            });

            viewUi.on("transitionout", function() {
               selectList.clearSelection();
            });
         },
         activate: function(params, data) {
            if(!data) {
               return;
            }
            listData = data;
            itemTemplate = listData.template;

            var title = listData.title || "Select",
                    items = listData.items || [],
                    selectedIndex = Number(listData.selectedIndex) || -1;

            selectListTitle.html(title);
            selectList.setItems(items);
            selectList.selectItemAt(selectedIndex);
         }
      };
   }
});