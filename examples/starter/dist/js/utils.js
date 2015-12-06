/* global h5 */
/*
 * $.deepCopy(Object) plugin
 */
(function($, undefined) {
  $.Utils = {
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],

        days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],

        tzOffset: "",

        getMonth: function(num) {
           return this.months[num];
        },

        getFormattedDate: function(date, bShort, bTime) {
           var strDate = [
                 date.getDate(),
                 this.months[date.getMonth()],
                 bShort ? " " : date.getFullYear()
           ].join(" ");

           if(bTime !== false) {
              strDate += " " + this.getReadableTime(date.getHours(), date.getMinutes());
           }
           return strDate;
        },

        getReadableTime: function (hr, min) {
           var ampm = hr < 12 ? " AM" : " PM",
           hr = (hr > 12) ? hr - 12 : hr;
           if(hr == 0) {
              hr = 12;
           }
           if(min < 10) {
              min = "0" + min;
           }

           return hr + ":" + min + ampm;
        },

        getDay: function(date){
          return this.days[date.getDay()];
        },
        
        
        
        roundToDecimalPlaces: function(num, places) {
           var n = Math.pow(10, places || 1);
           return Math.round(num * n) / n;
        },
        
        /**
         * Recursively copy an object into to return a new object. Handles nested structures like arrays and objects
         * Warning!! Does not handle circular references
         * @param {Any} obj
         * @returns {Any} The newly copied object
         */
        deepCopy: function copyOf(obj) {
          var type = $.getTypeOf(obj), copy = null;
          switch(type) {
            case "Object":
              if(obj != null) {
                copy = {};
                for(var k in obj) {
                  copy[k] = copyOf(obj[k]);
                }
              }
              break;
            case "Array":
              copy = [];
              for(var i = 0, len = obj.length; i < len; i++) {
                copy[i] = copyOf(obj[i]);
              }
              break;
            case "Date":
              copy = new Date(obj.getTime());
              break;
            default:
              copy = obj;
              break;
          }
          return copy;
        }
     };
  
})(h5);