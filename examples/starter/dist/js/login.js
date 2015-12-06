/* global Application */
Application.addRoute("/login", {
  id: "loginView",
  factory: function(App, viewUi) {    
    var loginForm = $("#loginForm"),
        loginBinder = loginForm.binder({
          model: {}
        }),
        serverUrl = "/",
        usernameField, passwordField,
        Notification = App.Notification,
        Events = $.EventTypes;
    

    function routeTo(path, delay) {
      window.setTimeout(function() {
        App.showView(path);
      }, delay || 10);
    }

    function showForm() {
      loginForm.addClass("show");
    }
    
    function hideForm() {
      loginForm.removeClass("show");
    }
    
    function tryLogin() {                      
      // authenticate(uname, passwd);
      showForm();
    }
    
    function authenticate(username, password) {
      if(!username || !password) {
        Notification.error("Please specify a username and a password");
        showForm();
        return;
      }
      App.showView("/main");
    }
    
    function login() {
      usernameField.get(0).blur();
      passwordField.get(0).blur();
      
      setTimeout(function() {
        var userData = loginBinder.getModel();
        authenticate(userData.username, userData.password);
      }, 500);      
    }
    
    return {
      initialize: function() {
        usernameField = $("#username");
        passwordField = $("#password");
        
        $("#loginButton").on(Events.tap, function() {
          login();
        });
        $("#password").on("keypress", function(ke) {
          if(ke.keyIdentifier === "Enter" || ke.keyCode === 13) {
            login();
          }
        });
        
        $("#selectServer").on(Events.tap, function() {
          App.showView("/select-server", null, function(server) {
            serverUrl = server;
          });
        });
      },
      
      activate: function(routeParams, data) {
        setTimeout(tryLogin, 1000);
      },
      
      deactivate: function() {
      },
      
      destroy: function() {
      }
    };
  }
});