/**
 * The DataList widget. Creates a selectable list from the specified data
 * @Usage 
 * $("selector").DataList(options);
 * The options object takes the following:
 * values:
 * {
 *    listClass: css class for list, default "list",
 *    itemClass: css class for list item, default "list-item",
 *    data: The data array, default empty array
 *    render: A function to render list item "function(list-widget, $(curr-item), index, data[index])"
 *    onselectionchange: a handler function called when list selection changes
 * }
 * @author aniketn3@gmail.com
 */
(function($) {
   var defaults = {
      listClass: "list",
      itemClass: "list-item",
      data: [],
      template: null,
      render: null,
      onselectionchange: function(currItem, oldItem) {}
   },
   isTypeOf = $.isTypeOf,
   forEach = $.forEach,
   uuid = $.uuid,
   action = "ontouchstart" in document.documentElement ? "tap" : "click"; 
   
   /**
    * Render each item using the specified renderer
    */
   function renderItem(widget, objItem, itemIdx, opts)  {
      var li = document.createElement("li"), item = $(li), content;
      item.data("model", objItem);
      item.data("index", itemIdx);

      item.addClass(opts.itemClass);
      item.attr("id", "li" + uuid());
      content = opts.render(widget, item, itemIdx, objItem);

      // check if the renderer has already appended
      if(!item.html()) {
         if(isTypeOf(content, "String"))   {
            item.html(content);
         }else {
            item.append(content);
         }
      }
      return item;
   }
   
   $.extension("DataList", function(options) {
      // these are our final options
      var opts = $.extend({}, defaults, options),
      // copy the data array
      data = opts.data.slice(0),
      // the current selected item
      selectedItem, 
      // all the items in our list
      allItems,
      // our root element, create it if not present
      listRoot,
      enabled = true,
      element = this.get(0), 
      ul, widget;
      
      opts.render = opts.render || function(list, item, idx, datum) {
         return opts.template ? opts.template.process(datum) : datum + "";
      };
      
      /**
       * Render the entire list widget
       */
      function render() {
         allItems = [];
         listRoot.html("");
         
         if(data && data.length)   {
            var items = document.createDocumentFragment(); //not supported in IE 5.5
            forEach(data, function(datum, i) {
               var $li = renderItem(widget, datum, i, opts);
               items.appendChild($li.get(0));
               allItems[allItems.length] = $li;
            });
            listRoot.append(items);
         }
      }
      
      function fireSelectionChanged(item)  {
         var old = null, ret;
         if(selectedItem)  {
            old = selectedItem;
            if(selectedItem === item)  {
               return;
            }
         }
         // this is needed so that onselection change handlers can can call this.getSelectedItem
         selectedItem = item; 
         
         ret = opts.onselectionchange.call(widget, item, old);
         if(ret !== false) {
            if(old) {
               old.removeClass("selected");
            }
            selectedItem = item;
            if(selectedItem) {
               selectedItem.addClass("selected");
            }
         }else {
            selectedItem = old;
         }
      }
      
      if(element.tagName.toLowerCase() === "ul")  {
         listRoot = this;
         ul =listRoot.get(0);
      }else {
         ul = document.createElement("ul");
         this.append(ul);
         listRoot = $(ul);
      }
      listRoot.addClass(opts.listClass);
      
      listRoot.on(action, function(e) {
         var t = e.target, parent = t.parentNode, idx, item;
         if(parent === ul) {
            item = t;
         }else {
            while(parent && parent !== ul) {
               item = parent;
               parent = parent.parentNode;
            }
         }
         idx = $(item).data("index");
         if(typeof idx !== "undefined") {
            item = allItems[idx];
            fireSelectionChanged(item);
         }
      });
      
      // our public API that is exposed to the widget
      widget = {
         getElement: function() {
            return listRoot;
         },
         
         setItems: function(itemData) {
            listRoot.html("");
            data = itemData || [];
            selectedItem = null;
            render();
         },
         
         setEnabled: function(bEnabled)  {
            enabled = bEnabled === false ? false : true;
            if(enabled) {
               listRoot.removeClass("disabled");
            }else {
               listRoot.addClass("disabled");
            }
         },
         
         getItems: function() {
            return data.slice(0);
         },

         getSelectedItem: function() {
            return selectedItem;
         },
         
         getSelectedIndex: function() {
            var i, len;
            if(!selectedItem) {
               return -1;
            }
            for(i = 0, len = allItems.length; i < len && allItems[i] !== selectedItem; i++);
            return i === len ? -1 : i;
         },

         selectItemAt: function(idx)   {
            var len = allItems.length;
            if(idx < len && idx >= 0)  {
               fireSelectionChanged(allItems[idx]);
            }
         },
         
         setItemAt: function(idx, datum) {
            var itm = allItems[idx], content;
            if(itm) {
               data[idx] = datum;
               itm.data("model", datum);

               content = opts.render(widget, itm, idx, datum);
               // check if the renderer has already appended
               if(content) {
                  if(isTypeOf(content, "String"))   {
                     itm.html(content);
                  }else {
                     itm.append(content);
                  }
               }
            }
         },
         
         clearSelection: function() {
            fireSelectionChanged(null);
         }
      };
      
      render();
      
      return widget;
   });
})(h5);



