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
         selectedTab;
         
      function layout() {
         
      }
         
      function selectTab(tab) {
         var oldTab = selectedTab, tabContent, ret, tabObj;
         if(!tab || tab === selectedTab) {
            return;
         }
         
         selectedTab = tab;
         ret = opts.ontabchange.call(widget, tab, oldTab);
         
         if(ret !== false) {
            if(oldTab) {
               tabObj = $(oldTab);
               tabObj.removeClass("selected");
               tabContent = $(tabObj.attr("data-ref"));
               tabContent.removeClass("active");
            }
            
            tabObj = $(tab);
            tabObj.addClass("selected");
            tabContent = $(tab.attr("data-ref"));
            tabContent.addClass("active");
         }else {
            selectedTab = oldTab;
         }
      }
      
      // our widget API object
      widget = {
         getSelectedIndex: function()  {
            try {
               return tabs.indexOf(selectedTab);
            }catch(e) {
               for(var i = 0, len = tabs.length; i < len && tabs[i] !== selectedTab; i++);
               return i == len ? -1 : i;
            }
         },
         
         selectTab: function(idx)   {
            var tab = tabs[i];
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
         var tb = $(elem);
         tabs[tabs.length] = tb;
         // tb.data("UI_TAB", tb);
         tb.on(TAP, function() {
            selectTab(tb);
         });
      });
      
      // by default select the tab as specified by selectedIndex
      selectTab(tabs[opts.selectedIndex || 0]);
      
      return widget;
   });
})(h5);




