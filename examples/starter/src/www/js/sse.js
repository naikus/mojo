(function(global) {
  /**
   * A simple event helper
   */
  function EventHelper() {
    var listenerMap = {
      "*": []
    };

    function getListeners(id) {
      var listeners = listenerMap[id];
      if(!listeners) {
        listeners = listenerMap[id] = [];
      }
      // console.log("listeners for " + id);
      // console.log(listeners);
      return listeners;
    }

    return {
      hasListeners: function(id) {
        var listeners = listenerMap[id];
        return listeners && listeners.length;
      },

      addListener: function(id, listener) {
        var arrListeners = getListeners(id);
        arrListeners.push(listener);
      },

      removeListener: function(id, listener) {
        var listeners = getListeners(id);
        for(var i = 0, len = listeners.length; i < len; i++) {
          if(listeners[i] === listener) {
            listeners.splice(i, 1);
            break;
          }
        }
      },

      removeAllListeners: function() {
        listenerMap = {};
      },

      dispatch: function(id, event) {
        getListeners("*").forEach(function(listener) {
          listener(event);
        });
        getListeners(id).forEach(function(listener) {
          listener(event);
        });
      }
    };
  }


  function createEventSource(channel) {
    var config = channel.config, source = new EventSource(config.url);
    source.addEventListener('open', function(e) {
      channel.eventHelper.dispatch("open", e);
    });
    source.addEventListener('error', function(e) {
      channel.eventHelper.dispatch("error", e);
    });
    source.addEventListener('close', function() {
      channel.eventHelper.dispatch("close", null);
    });
    source.addEventListener("message", function(e) {
      var strEvent = e.data, event;
      try {
        event = JSON.parse(strEvent);
        channel.eventHelper.dispatch(event.type, event);
      }catch(error) {
        channel.eventHelper.dispatch("error", strEvent);
      }
    });
    return source;
  }

  /**
   * A channel to SSE (Server Sent Events)
   * {
   *   url: "http://server.com/sse",
   *   events: "diskusage ramusage cpuusage"
   * }
   * @param config The configuration for this sse channel
   */
  function SSEChannel(config) {
    this.eventHelper = EventHelper();
    this.config = config;
  }
  SSEChannel.prototype = {
    open: function() {
      this.source = createEventSource(this);
    },

    on: function(eventType, listener) {
      var self = this;
      self.eventHelper.addListener(eventType, listener);
      return {
        dispose: function() {
          self.eventHelper.removeListener(eventType, listener);
        }
      };
    },

    close: function() {
      this.source && this.source.close();
    }
  };
  
 
  global.SSEChannel = SSEChannel;

})(this);