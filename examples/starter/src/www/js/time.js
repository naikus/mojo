Application.addRoute("/time", {
   id: "timeView",
   factory: function(app, viewUi) {
      var timeData, time,
            arrHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            // arrMin = [0, 10, 20, 30, 40, 50],
            arrMin = [],

            uiTimeBox,
            uiHours, uiMin, uiAmpm;

      (function() {
         for(var i = 0; i < 60; i++) {
            if(i % 5 === 0) {
               arrMin.push(i);
            }
            //arrMin[arrMin.length] = i;
         }
      })();

      function timeRenderer(widget, item, i, value) {
         if(value < 10) {
            return "0" + value;
         }
         return value;
      }

      function minuteRenderer(widget, item, i, value) {
         if(value % 15 === 0) {
            item.addClass("highlite");
         }

         if(value < 10) {
            return "0" + value;
         }
         return value;
      }

      function handleTimeChanged() {
         var hrs = uiHours.getSelectedValue(),
               min = uiMin.getSelectedValue(),
               ampm = uiAmpm.getSelectedValue();

         if(ampm === "PM") {
            if(hrs < 12) hrs = hrs + 12;
         }else {
            if(hrs === 12) hrs = 0;
         }

         updateModel(hrs, min);
         /*
         if(hrs < 10) {hrs = "0" + hrs;}
         if(min < 10) {min = "0" + min;}
         uiTimeBox.html(hrs + ":" + min + " Hrs");
         */
         uiTimeBox.html(Utils.getReadableTime(hrs, min));
      }

      function updateModel(hrs, min) {
         time.setHours(hrs);
         time.setMinutes(min);
      }

      function updateUi(hrs, min) {
         var ampmIdx = 0, hours = hrs;
         if(hrs > 12) {
            hours = hrs - 12;
         }
         if(hrs >= 12) {
             ampmIdx = 1;
         }
         uiHours.selectItemAt(hours == 0 ? 0 : arrHours.indexOf(hours));

         var roundedMin = roundToNearestMultiple(min, 5);
         var minIdx = arrMin.indexOf(roundedMin);
         if(minIdx === -1) {
            uiMin.selectItemAt(0);
         }else {
            uiMin.selectItemAt(minIdx);
         }
         uiAmpm.selectItemAt(ampmIdx);
      }

      /**
       * Rounds the given number to the nearest(ceil) multiple of the specified multiple.
       * e.g roundToNearestMultiple(21, 5) will give 25
       * @param {Number} number The number to round to
       * @param {Number} multiple The rounding multiple
       */
      function roundToNearestMultiple(number, multiple) {
         var rem = number % multiple;
         if(rem === 0) {
            return number;
         }
         return number + (multiple - (rem));
      }

      function getNearestTime() {
         var dt = new Date(), min = dt.getMinutes();
         // get the nearest minues (multiple of 5)
         min = roundToNearestMultiple(min, 5);

         // this will automatically adjust hours and minutes
         dt.setMinutes(min);
         return dt;
      }

      return {
         actions: [{
           type: "title",
           icon: "icon-alarmclock",
           title: "SCHEDULE TIME"
         }],
         initialize: function() {
            uiHours = $("#timeView ul.hours").datalist({
               itemClass: "activable",
               data: arrHours,
               render: timeRenderer,
               onselectionchange: handleTimeChanged
            });

            uiMin = $("#timeView ul.minutes").datalist({
               itemClass: "activable",
               data: arrMin,
               render: minuteRenderer,
               onselectionchange: handleTimeChanged
            });

            uiAmpm = $("#timeView ul.ampm").datalist({
               onselectionchange: handleTimeChanged
            });

            uiTimeBox = $("#timeBox");


            $("#timeView .time-actions .button").on(Events.tap, function(e) {
               var t = $(e.target), act = t.attr("data-action");

               if(act === "ok") {
                   timeData.hours = time.getHours();
                   timeData.minutes = time.getMinutes();
               }
               app.popView(timeData);
            });
         },

         activate: function(params, data) {
            timeData = data;
            time = getNearestTime();

            if(!timeData) {
               timeData = {
                  hours: time.getHours(),
                  minutes: time.getMinutes()
               };
            }

            time.setHours(timeData.hours);
            time.setMinutes(timeData.minutes);

            // update the UI to reflect new time
            updateUi(timeData.hours, timeData.minutes);
         }
      };
   }
});