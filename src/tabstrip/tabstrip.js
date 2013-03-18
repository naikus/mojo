(function($)   {
   var defaults = {
      ontabchange: function() {},
      selectedIndex: 0
   }, 
   action = "ontouchstart" in document.documentElement ? "tap" : "click";
   
   $.extension("tabstrip", function(options)  {
      var widget,
         // these are our final options
         opts = $.extend({}, defaults, options),
         // our plugin is bound to an HTML ul element
         tabs = [], 
         
         self = this,
         
         // selected tab's DOM element
         selectedTabInfo;
         
      function selectTab(tabInfo) {
         var oldInfo = selectedTabInfo, 
                 oldTab = oldInfo ? oldInfo.tab : null,
                 tab = tabInfo ? tabInfo.tab : null,
                 retVal;
         
         if(!tabInfo || tabInfo === selectedTabInfo) {
            return;
         }
         
         selectedTabInfo = tabInfo;
         retVal = opts.ontabchange.call(widget, tab, oldTab);
         
         if(retVal !== false) {
            if(oldInfo) {
               oldTab.removeClass("selected");
               oldInfo.content.removeClass("active");
            }
            
            tab.addClass("selected");
            tabInfo.content.addClass("active");
         }else {
            selectedTabInfo = oldInfo;
         }
      }
      
      function indexOf(tabInfo) {
         for(var i = 0, len = tabs.length; i < len; i++) {
            if(tabInfo === tabs[i]) {
               return i;
            }
         }
         return -1;
      }
      
      // our widget API object
      widget = {
         getSelectedIndex: function()  {
            try {
               return indexOf(selectedTabInfo);
            }catch(e) {
               for(var i = 0, len = tabs.length; i < len && tabs[i] !== selectedTabInfo; i++);
               return i === len ? -1 : i;
            }
         },
         
         selectTab: function(idx)   {
            var tab = tabs[idx];
            if(tab) {
               selectTab(tab);
            }
         },
         toString: function() {
            return "tabstrip " + self.selector;
         }
      };
      
      // initialization code
      $.forEach(this.children(".tab"), function(elem) {
         var tb = $(elem), tabInfo;
         
         tabs[tabs.length] = tabInfo = {
            tab: tb,
            content: $(tb.attr("data-ref"))
         };
         tb.on(action, function() {
            selectTab(tabInfo);
         });
      });
      
      // by default select the tab as specified by selectedIndex
      selectTab(tabs[opts.selectedIndex || 0]);
      
      return widget;
   });
})(h5);




