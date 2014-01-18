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
 *    selectedIndex: The index of the item that needs to be selected by default,
 *    template: The template to use to render each item
 *    render: A function to render list item "function(list-widget, $(curr-item), index, data[index])"
 *    onselectionchange: a handler function called when list selection changes
 * }
 * @author aniketn3@gmail.com
 */
(function($) {
   var defaults = {
      listClass: "list",
      itemClass: "list-item",
      selectable: true,
      data: [],
      selectedIndex: -1,
      template: null,
      render: null,
      onselectionchange: function(currItem, oldItem) {}
   },
   isTypeOf = $.isTypeOf,
   forEach = $.forEach,
   uuid = $.uuid,
   UI_KEY = "uiItem",
   MODEL_KEY = "model",
   action = "ontouchstart" in document.documentElement ? "tap" : "click"; 
   
   /**
    * Render the item 
    * @param {type} widget The list widget
    * @param {type} uiItem The current UI item (li)
    * @param {type} objItem The model item
    * @param {type} itemIdx The index at which currently rendering
    * @param {type} opts The options passed to widget
    * @returns {unresolved} Either the rendered item that will be attached to the li element
    * (string, dom element) or the if renderer itself appends to li, returns null or undefined
    */
   function renderItem(widget, uiItem, objItem, itemIdx, opts)  {
      var content, i, len, itmCls = opts.itemClass, liRaw
      uiItem.data(MODEL_KEY, objItem);

      if(itmCls) {
         for(i = 0, len = itmCls.length; i < len; i++) {
            uiItem.addClass(itmCls[i]);
         }
      }
      content = opts.render(widget, uiItem, itemIdx, objItem);
      
      liRaw = uiItem.get(0);
      if(!liRaw.id) {
         liRaw.id = "itm"+ uuid();
      }

      // check if the renderer has already appended
      if(content) {
         if(isTypeOf(content, "String"))   {
            uiItem.html(content);
         }else {
            uiItem.append(content);
         }
      }
      // @TODO will this create a leak?
      liRaw._item_ = uiItem; // store this to quickly retrieve the item selection change
      return uiItem;
   }
   
   $.extension("datalist", function(options) {
      // these are our final options
      var opts = $.shallowCopy({}, defaults, options),
      // copy the data array
      data = (opts.data || []).slice(0),
      // the current selected item
      selectedItem, 
      // all the items in our list
      allItems,
      // our root element, create it if not present
      listRoot,
      // existing children of this list root
      children,
            
      listClass = opts.listClass,
      
      enabled = true,
      element = this.get(0), 
      ul, widget;
      
      if(!element) {
         throw new Error("Datalist element not found. Please check your selector");
      }
      
      opts.listClass = listClass = listClass ? listClass.split(" ") : null;
      opts.itemClass = opts.itemClass ? opts.itemClass.split(" ") : null;
      
      opts.render = opts.render || function(list, item, idx, datum) {
         return opts.template ? opts.template.process(datum) : datum + "";
      };
      
      /*
       * Render the entire list widget
       */
      function render(selIndex) {
         allItems = [];
         listRoot.html("");
         
         if(data && data.length)   {
            var items = document.createDocumentFragment(), //not supported in IE 5.5
                  i, len, $li;
            for(i = 0, len = data.length; i < len; i++) {
               $li = $(document.createElement("li"));
               $li = renderItem(widget, $li, data[i], i, opts);
               items.appendChild($li.get(0));
               allItems[allItems.length] = $li;
               
               if(i === selIndex) {
                  selectedItem = $li;
                  $li.addClass("selected");
               }
            }
            listRoot.append(items);
         }
      }
      
      function insertItemsAt(arrData, idx) {
         var origItem, items, i, len, $li, arrLis = [], splice = Array.prototype.splice;
         idx = Number(idx);
         if(isNaN(idx) || idx < 0 || idx > data.length + 1) {
            return;
         }
         
         items = document.createDocumentFragment(); //not supported in IE 5.5
         for(i = 0, len = arrData.length; i < len; i++) {
            var $li = renderItem(widget, arrData[i], i, opts);
            items.appendChild($li.get(0));
            arrLis[arrLis.length] = $li;
         };
         
         if(idx === data.length) {
            listRoot.append(items);
         }else {
            origItem = allItems[idx];
            origItem.before(items);
         }
         
         splice.apply(allItems, [idx, 0].concat(arrLis));
         splice.apply(data, [idx, 0].concat(arrData));
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
         
         ret = opts.onselectionchange.call(widget, item ? item.data(MODEL_KEY) : null, 
               old ? old.data(MODEL_KEY) : null);
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
      
      function insertItemAt(objItem, idx) {
         var itm, origItem;
         idx = Number(idx);
         if(isNaN(idx) || idx < 0 || idx > data.length + 1) {
            return;
         }
         itm = renderItem(widget, objItem, idx, opts);
         
         if(idx === data.length) {
            listRoot.append(itm);
         }else {
            origItem = allItems[idx];
            origItem.before(itm);
         }
         allItems.splice(idx, 0, itm);
         data.splice(idx, 0, objItem);
      }
      
      function removeItemAt(idx) {
         var itm, objItm;
         idx = Number(idx);
         if(!isNaN(idx) && idx >= 0 && idx < data.length) {
            itm = allItems.splice(idx, 1)[0];
            objItm = data.splice(idx, 1)[0];
            if(itm && objItm) {
               listRoot.remove(itm.get(0));
               if(itm === selectedItem) {
                  selectedItem = null;
               }
            }
         }
      }
      
      function removeItems(filterFunc) {
         var filtered = [];
         forEach(data, function(datum, i) {
            if(filterFunc(datum)) {
               filtered[filtered.length] = i;
            }
         });
         
         forEach(filtered, function(fi) {
            removeItemAt(fi);
         });
      }
      
      function getItemFromEvent(e) {
         var t = e.target, parent = t.parentNode, item, ul = listRoot.get(0);
         
         if(t === ul) {
            return null;
         }
         
         if(parent === ul) {
            item = t;
         }else {
            while(parent && parent !== ul) {
               item = parent;
               parent = parent.parentNode;
            }
         } 
         return parent === ul ? item : null;
      }
      
      function on(evt, callback) {
         listRoot.on(evt, function(e) {
            var liElem = getItemFromEvent(e), item, itemData;
            if(!liElem) {
               return;
            }
            item = liElem._item_;
            itemData = item.data(MODEL_KEY);
            
            callback(e, item, itemData);
         });
      }
      
      if(element.tagName.toLowerCase() === "ul")  {
         listRoot = this;
      }else {
         listRoot = $(document.createElement("ul"));
         this.append(listRoot);
      }
      
      if(listClass) {
         forEach(listClass, function(cl) {
            listRoot.addClass(cl);
         });
      }
      
      if(opts.selectable) {
         on(action, function(e, li, item) {
            if(li) {
               fireSelectionChanged(li);
            }
         });         
      }
      
      // our public API that is exposed to the widget
      widget = {
         on: on,
         
         getElement: function() {
            return listRoot;
         },
         
         size: function() {
            return data.length;
         },
         
         setItems: function(itemData, selIndex) {
            listRoot.html("");
            data = itemData || [];
            selectedItem = null;
            render(selIndex);
         },
         
         insertItemAt: function(objItem, i) {
            if(typeof i === "undefined") {
               i = data.length;
            }
            insertItemAt(objItem, i);
         },
         
         insertItemsAt: function(arrObjItems, i) {
            if(typeof i === "undefined") {
               i = data.length;
            }
            insertItemsAt(arrObjItems, i);
         },
         
         insertItem: function(objItem) {
            insertItemAt(objItem, data.length);
         },
         
         removeItemAt: function(i) {
            removeItemAt(i);
         },
         
         removeItems: function(filter) {
            if(typeof filter === "function") {
               removeItems(filter);
            }
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
                 
         getSelectedValue: function() {
            return selectedItem ? selectedItem.data(MODEL_KEY) : null;
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
                 
         selectItem: function(filter) {
            var idx = this.indexOf(filter);
            if(idx !== -1) {
               this.selectItemAt(idx);
            }
         },
                 
         indexOf: function(filter) {
            var idx = -1, i, len = data.length;
            if(typeof filter === "function") {
               for(i = 0; i < len; i++) {
                  if(filter(data[i])) {
                     idx = i;
                     break;
                  }
               }
            }else {
               for(var i = 0; i < len; i++) {
                  if(filter === data[i]) {
                     idx = i;
                     break;
                  }
               }
            }
            return idx;
         },
         
         getItemAt: function(idx) {
            var len = allItems.length;
            if(idx < len && idx >= 0)  {
               return allItems[idx].data(MODEL_KEY);
            }
            return null;
         },
         
         setItemAt: function(idx, datum) {
            var itm = allItems[idx], content;
            if(itm) {
               data[idx] = datum;
               itm.data(MODEL_KEY, datum);

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
         },
         
         update: function(idx) {
            if(typeof idx !== "undefined") {
               renderItem(this, allItems[idx], data[idx], idx, opts);
            }
         }
      };
      
      // some initialization code (for lists with existing item markup) Experimental!!!
      children = listRoot.children(); // listRoot.find("li:nth-child(n+1)");
      if(children.length) { // we have children
         allItems = data = [];
         forEach(children, function(li, i) {
            var $li = $(li);
            // $li.data(UI_KEY, $li);
            li._item_ = $li; 
            $li.data(MODEL_KEY, li.textContent || li.innerText);
            allItems[allItems.length] = $li;
            if($li.hasClass("selected")) {
               selectedItem = $li;
            }
         });
      }else {
         render(opts.selectedIndex);
      }
      
      return widget;
   });
})(h5);




