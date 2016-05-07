/* global Application */
Application.addRoute("/select-server", {
  id: "selectServerView",
  factory: function(App, viewUi) {
    var Notification = App.Notification,
        selectedServer = null,
        Events = $.EventTypes,
        uiServerList,
        Storage = window.localStorage,
        addServerFormBinder = $("#addServerForm").binder();
    
    function getServerList() {
      var list = JSON.parse(Storage.getItem("App.serverList"));
      if(!list) {
         list = [
           "http://localhost:8080"
         ];
         Storage.setItem("App.serverList", JSON.stringify(list));
      }
      return list;
    }
    
    function addServerToList(serverUrl) {
      if(serverUrl.indexOf("http://") === -1 && serverUrl.indexOf("https://") === -1) {
        serverUrl = "http://" + serverUrl;
      }
      
      var list = getServerList();
      list.push(serverUrl);
      Storage.setItem("App.serverList", JSON.stringify(list));
      return serverUrl;
    }
    
    function toggleAddForm() {
      viewUi.dispatch("toggleaddform");
    }
    
    function hideForm() {
      viewUi.find(".content").removeClass("show-form");
    }
    
    viewUi.on("toggleaddform", function() {
      var action = App.ActionBar.getAction("showFormAction");
      if(action.hasClass("on")) {
        action.removeClass("on");
        viewUi.find(".content").removeClass("show-form");
      }else {
        action.addClass("on");
        viewUi.find(".content").addClass("show-form");
      }
    });
    
    return {
      actions: [
        {
          type: "action",
          icon: "icon icon-arrow-left",
          handler: function() {
            App.popView(selectedServer);
          }
        },
        {
          type: "title",
          title: "SELECT/ADD A SERVER"
        },
        {
          type: "action",
          id: "showFormAction",
          icon: "icon rotate icon-plus",
          alignment: "right",
          handler: toggleAddForm
        }
      ],
      
      initialize: function() {
        
        viewUi.on("transitionout", hideForm);
        
        $("#cancelServer").on(Events.tap, function() {
          $("#serverUrl").get(0).blur();
          toggleAddForm();
        });
        
        $("#addServer").on(Events.tap, function() {
          var serverUrl = addServerFormBinder.getModel().serverUrl;
          if(!serverUrl) {
            Notification.error("Please input a server url. e.g. http://ipaddress:port");
            return;
          }
          $("#serverUrl").get(0).blur();
          addServerFormBinder.update("serverUrl", "");
          serverUrl = addServerToList(serverUrl);
          uiServerList.appendItem(serverUrl);
          
          toggleAddForm();
        });
        
        uiServerList = $("#serverList").repeat({
          items: getServerList()
        });
        uiServerList.onItem(Events.tap, function(event, data) {
          var model = data.item;
          App.popView(model);
        });
      },
      
      deactivate: function() {
        $("#serverUrl").get(0).blur();
      }
    };
  }
});