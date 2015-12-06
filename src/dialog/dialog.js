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
          return;
        }

        body.addClass("dialog-showing");

        // show dialog pane
        dialogPane.addClass("showing");

        currDialogInfo = dialogInfo;
        dialogInfo.dialog.removeClass("hidden");
        dialogInfo.dialog.once("show", function() {
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
        body.removeClass("dialog-showing");
        if(currDialogInfo) {
          currDialogInfo.dialog.removeClass("showing");
          currDialogInfo.dialog.once("hide", function() {
            dialogPane.removeClass("showing");
            currDialogInfo.dialog.addClass("hidden");
            if(callback) {
              callback(currDialogInfo.dialog);
            }
            currDialogInfo.onhide(currDialogInfo.dialog);
            currDialogInfo = null;
          });

          currDialogInfo.dialog.removeClass("in");
        }
      }
    };

    return manager;
  });
})(h5);