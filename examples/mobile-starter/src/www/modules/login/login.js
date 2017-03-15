/* global Application */
Application.addRoute("/login", {
  id: "loginView",
  factory: function(App, viewUi) {
    var loginForm = $("#loginForm"),
        loginBinder,
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
      var uname = null, passwd = null;
      if(uname && passwd) {
        authenticate(uname, passwd);
      }else {
        showForm();
      }
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
      // Blur is to hide the device keyboard
      usernameField.get(0).blur();
      passwordField.get(0).blur();

      setTimeout(function() {
        var userData = loginBinder.getModel();
        authenticate(userData.username, userData.password);
      }, 100);
    }

    return {
      initialize: function() {
        usernameField = $("#username");
        passwordField = $("#password");

        loginBinder = loginForm.binder({
          model: {
            username: usernameField.val(),
            password: passwordField.val()
          }
        });

        $("#loginButton").on(Events.tap, login);
        $("#password").on("keypress", function(ke) {
          if(ke.keyIdentifier === "Enter" || ke.keyCode === 13) {
            login();
          }
        });

        $("#selectServer").on(Events.tap, function() {
          App.showView("/select-server", null, function(server) {
            Notification.info("Selected server " + server);
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