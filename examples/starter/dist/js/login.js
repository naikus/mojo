/* global Application, TechService, Events */
Application.addRoute("/login", {
  id: "loginView",
  factory: function(App, viewUi) {    
    var loginForm = $("#loginForm"),
        loginBinder = loginForm.binder({
          model: {}
        }),
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
      var currentUser = TechService.currentUser();
      console.log(currentUser);
      if(!currentUser) {
        showForm();
        return;
      }
      var uname = currentUser.username, 
          passwd = currentUser.password;                       
      authenticate(uname, passwd);
    }
    
    function authenticate(username, password) {
      if(!username || !password) {
        Notification.error("Please specify a username and a password");
        showForm();
        return;
      }
      
      TechService.authenticate(username, password, 
          function() {
            hideForm();
            routeTo("/main", 200);
          }, 
          function(code, xhr) {
            showForm();
            if(code >= 400 && code < 500) {
              Notification.error("Please check your account details and try again.");
            }else {
              Notification.error("There was an error communicating with the server");
            }
          }
      );
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
            TechService.serverUrl(server);
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