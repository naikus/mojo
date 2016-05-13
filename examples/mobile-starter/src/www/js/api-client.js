/* global h5 */
/*
 * REST API client
 */
(function($, undefined) {
  var defaults = {
    baseUrl: "api",
    username: null,
    password: null,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json"
    }
  };

  /*
   * Simple REST API plugin.
   * uses http-like method names to do rest calls.
   * e.g.
   * <code>
   * REST     METHOD
   * ----------------
   * delete   del
   * create   post
   * update   put
   * get      get
   * ----------------
   * </code>
   *
   * The Api object exposes four methods that map to crud operations.
   * <code>
   * get, post, put, del
   * </code>
   * All of these take following an options object with following parameters.
   * <code>
   * options = {
   *    path: The API path to call. e.g. "user/loginWithTwitter"
   *    data: An object containing additional data required to call the 'path'
   *    success: An optional callback function to call upon successful call of the 'apiMethod'
   *    failure: An optional callback function to call upon failure calling the 'apiMethod'
   * }
   *
   * If you are using https and base64 encoding and basic authorization use this like so.
   * This needs js/lib/base64.min.js included in your index.html
   *
   * var Api = $.Api({
   *    baseUrl: url,
   *    headers: {
   *       Authorization: 'Basic ' + Base64.encode(uname + ":" + pass),
   *       "Content-Type": "application/json"
   *    }
   * });
   * </code>
   */
  $.Api = function(options) {
    var forEach = $.forEach,
            isArray = $.isArray,
            getTypeOf = $.getTypeOf,
            opts = $.shallowCopy({}, defaults, options),
            noop = function() {
            },
            // onLine = ("online" in navigator) ? navigator.onLine : true,
            ret = {};

    function gotOnline() {
      console.log("We are online");
    }

    function gotOffline() {
      console.log("We are offline");
    }

    function asParams(key, val, arrPostData) {
      if(isArray(val)) {
        encodeArray(key, val, arrPostData);
      }else if(getTypeOf(val) === "Object") {
        encodeObject(key, val, arrPostData);
      }else {
        var k = key ? encodeURIComponent(key) + "=" : "";
        arrPostData.push(k + encodeURIComponent(val));
      }
    }

    function encodeObject(key, objVal, arrPostData) {
      forEach(objVal, function(v, k) {
        var newKey = key ? key + "." + k : k;
        asParams(newKey, v, arrPostData);
      });
    }

    function encodeArray(key, arrVals, arrPostData) {
      for(var i = 0, len = arrVals.length; i < len; i++) {
        asParams(key, arrVals[i], arrPostData);
      }
    }

    /**
     * Calls an API method using one of the http methods
     * @param {String} method The http method. One of get|post|put|delete
     * @param {Object} options The additional parameters for this api call.
     * The options parameter should contain following:
     * <code>
     * options = {
     *    path: The API path to call. e.g. "user/loginWithTwitter"
     *    data: An object containing additional data required to call the 'path'
     *    success: An optional callback function to call upon successful call of the 'apiMethod'
     *    failure: An optional callback function to call upon failure calling the 'apiMethod'
     * }
     * </code>
     */
    function apiCall(method, options) {
      /*
      if(!onLine) {
        console.log("Application is offline.");
        return;
      }
      */
      var baseUrl = options.baseUrl ? options.baseUrl : opts.baseUrl;
      console.log(baseUrl);

      var apiPath = baseUrl + (options.path || ""),
              reqData, headers = $.shallowCopy({}, opts.headers, options.headers);

      // console.log("Calling API method " + apiPath);
      var queryString, useTimestamp = options.timestamp !== false;
      
      if(options.data) {
        if(method === "GET") {
          var postData = [];
          if(useTimestamp) {
            postData.push(new Date().getTime());
          }
          asParams(null, options.data, postData);
          queryString = postData.join("&");
        }else if(method === "DELETE") {
          // reqData = null;
          queryString = useTimestamp ? new Date().getTime() : "";
        }else {
          queryString = useTimestamp ? new Date().getTime() : "";
          var ct = headers["Content-Type"];
          if(ct === "application/x-www-form-urlencoded") {
            if(typeof options.data === "string") {
              reqData = options.data;
            }else {
              var postData = [];
              asParams(null, options.data, postData);
              reqData = postData.join("&");
            }
          }else {
            if(!ct) {
              headers["Content-Type"] = "application/json";
            }
            reqData = JSON.stringify(options.data);
          }
        }
      }

      if(queryString) {
        apiPath += "?" + queryString;
      }
      /*
      if(options.timestamp !== false) {
        apiPath += "?" + new Date().getTime();
      }
      */
     
      $.ajax({
        url: apiPath,
        method: method,
        username: opts.username,
        password: opts.password,
        timeout: opts.timeout,
        data: reqData,
        headers: headers,
        dataType: options.dataType || "json",
        success: function(data, xhr) {
          // console.log(["SUCCESS", "method", apiMethod, JSON.stringify(data)].join(" ");
          (options.success || noop)(data, xhr);
        },
        error: function(code, xhr) {
          // console.log(["ERROR", "method", apiMethod, JSON.stringify(code)].join(" "));
          // doc.dispatch("apierror", {api: options.apiMethod, data: code});
          (options.failure || noop)(code, xhr);
        },
        ontimeout: function() {
          console.log(apiPath + " timed out");
          (options.failure || noop)("timeout");
        }
      });
    }

    $.forEach("get post put delete".split(' '), function(m) {
      var name = (m === "delete") ? "del" : m;
      ret[name] = function(path, options) {
        options.path = path;
        apiCall(m.toUpperCase(), options);
      };
    });

    // expose the low level apiCall method
    ret.call = apiCall;

    ret.asParams = function(objData) {
      var paramArray = [];
      asParams(null, objData, paramArray);
      return paramArray.join("&");
    };


    ret.option = function(name, value) {
      if(arguments.length === 1) {
        return opts[name];
      }else {
        opts[name] = value;
      }
    };


    ret.getBaseUrl = function() {
      return opts.baseUrl;
    };

    $(window).on("offline", gotOffline).on("online", gotOnline);
    return ret;
  };
})(h5);