// A very simple notifications plugin
(function ($) {
  $.extension("notifications", function() {
    var self = this,
        Events = $.EventTypes,
        timeoutId,
        msgQueue = [],
        running = false,
        uuid = $.uuid,
        widget = {
          clear: function(id) {
            if(id) {
              self.remove("#" + id);
              return;
            }else {
              msgQueue.splice(0, msgQueue.length);
              self.html("");
              self.addClass("hidden");
            }
          }
        };

    function clear() {
      self.removeClass("show");
      widget.clear();
    }

    function showMessages() {
      var msg;
      if(msgQueue.length) {
        msg = msgQueue.shift();
        self.prepend([
          '<p data-sticky="', msg.sticky, '" id="', msg.id, '" class="message ', msg.type, '">',
          msg.content,
          '</p>'
        ].join(""));
        var m = self.find("#" + msg.id),
            remove = function () {
              widget.clear(msg.id);
              showMessages();
            };
        setTimeout(function () {
          m.addClass("show");
          if(!msg.sticky) {
            timeoutId = setTimeout(remove, (msg.type === "error" ? 6000 : 3000));
          }else {
            timeoutId = setTimeout(showMessages, 500);
          }
          m.on(Events.tap, remove);
          // timeoutId = setTimeout(showMessages, 500);
        }, 50);
      }else {
        if(self.children().length === 0) {
          self.addClass("hidden");
        }
        running = false;
      }
    }

    function notify() {
      if(!running) {
        running = true;
        self.removeClass("hidden");
        showMessages();
      }
    }

    ["info", "error", "success", "warn"].forEach(function (val) {
      widget[val] = function (msg, sticky) {
        var msgId = "msg_" + uuid();
        msgQueue.push({
          id: msgId,
          type: val,
          content: msg,
          sticky: !!sticky
        });
        notify();
        return msgId;
      };
    });

    widget.alert = function (msg, callback, title, label) {
      if(navigator.notification) {
        navigator.notification.alert(msg, callback, title, label);
      }else {
        alert(msg);
        if(callback) {
          callback();
        }
      }
    };

    widget.confirm = function (msg, callback, title, arrLabels) {
      if(navigator.notification) {
        navigator.notification.confirm(msg, callback, title, arrLabels);
      }else {
        var val = confirm(msg);
        callback(val ? 1 : 2);
      }
    };

    widget.vibrate = function(duration) {
      if(navigator.vibrate) {
         navigator.vibrate(duration || 40);
      }
    };

    return widget;
  });
})(h5);