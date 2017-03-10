// Simple application dialogs
(function($) {
  $.extension("dialogmanager", function() {
    var dialogPane = this,
        currDialogInfo = null,
        dialogs = {},
        noop = function() {},
        body = $(document.body),
        transitionEndEvent = $.Env.property("transitionend") || "transitionend";

    var manager =  {
      register: function(name, selector, options) {
        var diag = $(selector),
            diagElem = diag.get(0),
            diagParent = diagElem.parentNode,
            dialogInfo;

        if(diagParent) {
          diagParent.removeChild(diagElem);
          diag.addClass("hidden").addClass("dialog");
          dialogPane.append(diag);
          dialogInfo = dialogs[name] = {
            dialog: diag,
            initialize: options.initialize || noop,
            onshow: options.onshow || noop,
            onhide: options.onhide || noop
          };

          diag.on(transitionEndEvent, function(e) {
            if(diag.hasClass("in")) {
              diag.addClass("ready");
              diag.dispatch("show");
            }else {
              diag.dispatch("hide");
            }
          });

          dialogInfo.initialize(diag);
        }
      },

      showDialog: function(name) {
        var dialogInfo = dialogs[name];
        if(!dialogInfo) {
          throw new Error("Dialog not registered");
        }

        // if already showing dialog, hide it. We don't support multiple dialogs
        if(currDialogInfo) {
          console.log("Dialog already showing", currDialogInfo);
          return;
        }

        body.addClass("dialog-showing");

        // show dialog pane
        dialogPane.addClass("showing");

        currDialogInfo = dialogInfo;
        dialogInfo.dialog.removeClass("hidden");
        dialogInfo.dialog.on("show", function h() {
          dialogInfo.dialog.un("show", h);
          dialogInfo.onshow(dialogInfo.dialog);
        });

        setTimeout(function() {
          currDialogInfo.dialog.addClass("in");
        }, 50);
      },

      isDialogShowing: function() {
        return !!currDialogInfo;
      },

      hideCurrentDialog: function(callback) {
        var dialog;
        if(currDialogInfo) {
          dialog = currDialogInfo.dialog;
          if(!dialog.hasClass("ready")) {
            console.log("Dialog not ready, not closing.");
            return;
          }
          dialog.on("hide", function h() {
            dialog.un("hide", h);
            body.removeClass("dialog-showing");
            dialog.removeClass("ready");
            dialogPane.removeClass("showing");
            dialog.addClass("hidden");
            if(callback) {
              callback(dialog);
            }
            currDialogInfo.onhide(dialog);
            currDialogInfo = null;
          });
          setTimeout(function() {
            dialog.removeClass("in");
          }, 50);
        }
      }
    };

    return manager;
  });
})(h5);