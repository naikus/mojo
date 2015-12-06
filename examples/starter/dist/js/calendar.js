Application.addRoute("/calendar", {
  id: "calendarView",
  factory: function(App, viewUi) {
    var actYearsPrevious, actYearsNext, uiYears, uiMonths, uiDates, uiDays,
        months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
        days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        calData,
        calDate;

    function getLastDay(month, year) {
      var day = 30;
      switch(month) {
        case "Jan":
        case "Mar":
        case "May":
        case "Jul":
        case "Aug":
        case "Oct":
        case "Dec":
        case 0:
        case 2:
        case 4:
        case 6:
        case 7:
        case 9:
        case 11:
          day = 31;
          break;
        case "Feb":
        case 1:
          if(year % 4 === 0 && year % 100 !== 0 || year % 400 === 0) {
            day = 29;
          }else {
            day = 28;
          }
          break;
        default:
          day = 30;
      }
      return day;
    }

    function getDates(month, year) {
      var dt = new Date(), daysInMonth = getLastDay(month, year),
          dow,
          date = dt.getDate(),
          arrDates = [];

      dt.setDate(1);
      dt.setMonth(month);
      dt.setFullYear(year);

      dow = dt.getDay();

      // set the date back to original
      dt.setDate(date);

      for(var i = 0; i < dow; i++) {
        arrDates[arrDates.length] = "";
      }
      for(i = 1; i <= daysInMonth; i++) {
        arrDates[arrDates.length] = i;
      }

      return arrDates;
    }

    function updateCalendarData() {
      var year = calDate.getFullYear(),
          month = calDate.getMonth();

      // populate years
      uiYears.setItems(getYearDataNext(year));
      uiYears.selectItemAt(0);

      // select the current month
      uiMonths.selectItemAt(month);
    }

    function updateCalendarDates() {
      var arrDates = getDates(calDate.getMonth(), calDate.getFullYear());
      uiDates.setItems(arrDates);
      uiDates.selectItemAt(arrDates.indexOf(calDate.getDate()));
    }

    function getYearDataNext(year) {
      return [year, year + 1, year + 2, year + 3];
    }

    function getYearDataPrevious(year) {
      // if(year > 4) seriously??
      return [year - 3, year - 2, year - 1, year];
    }

    function navigateYears(e) {
      var act = $(e.target).attr("data-action"),
          yr = act === "prev" ? uiYears.getItemAt(0) : uiYears.getItemAt(uiYears.size() - 1),
          years = act === "prev" ? getYearDataPrevious(yr) : getYearDataNext(yr),
          currIdx = years.indexOf(calDate.getFullYear());

      uiYears.setItems(years);
      if(currIdx !== -1) {
        uiYears.selectItemAt(currIdx);
      }
    }

    return {
      initialize: function() {
        // Years control -------------------------------------------------------
        var calendar = viewUi.find(".calendar");

        // uiYears = $("#calendarView > .calendar > .year-bar > .years").datalist({
        uiYears = calendar.find(".year-bar > .years").datalist({
          itemClass: "activable",
          onselectionchange: function(val, oldVal) {
            calDate.setFullYear(val);
            updateCalendarDates();
          }
        });

        actYearsPrevious = calendar.find(".year-bar > .years-previous");
        actYearsPrevious.on(Events.tap, navigateYears);

        actYearsNext = calendar.find(".year-bar > .years-next");
        actYearsNext.on(Events.tap, navigateYears);


        // Months Control ------------------------------------------------------

        uiMonths = calendar.find(".months").datalist({
          itemClass: "activable",
          listClass: "",
          data: months,
          onselectionchange: function() {
            var mon = uiMonths.getSelectedIndex(),
                currDate = calDate.getDate(),
                lastDay = getLastDay(mon, calDate.getFullYear());

            /* 
             check if the current date is greater than last day
             because if we set the month and the last day of month is less than the current day
             the calendar will add a month. An example is if we select March 31 and then select
             Feb as month, the calendar will think Feb 31 and add 1 to its month since the date
             moved to a day in next month
             */
            if(currDate > lastDay) {
              calDate.setDate(lastDay);
            }

            calDate.setMonth(mon);
            updateCalendarDates();
          }
        });


        // Days Calendar --------------------------------------------------------

        uiDays = calendar.find(".days").datalist({
          listClass: "",
          itemClass: "",
          selectable: false,
          data: days
        });

        uiDates = calendar.find(".dates").datalist({
          itemClass: "activable",
          render: function(widget, item, i, day) {
            var tn = document.createTextNode(day);
            if(!day) {
              item.removeClass("activable").addClass("disabled");
              item.html("&#160;");
            }else {
              item.get(0).appendChild(tn);
            }
          },
          onselectionchange: function(newValue) {
            return !!newValue;
          }
        });

        uiDates.on(Events.tap, function(e, item, date) {
          if(date) {
            calDate.setDate(Number(date));
          }
        });


        // Actions -----------------------------------------------------
        viewUi.find(".cal-actions .button").on(Events.tap, function(e) {
          var t = $(e.target), act = t.attr("data-action"),
              dt = new Date(); //, now = new Date(dt.getTime());
          if(act === "cancel") {
            App.popView(calData);
            return;
          }

          dt.setFullYear(calDate.getFullYear());
          dt.setMonth(calDate.getMonth());
          dt.setDate(calDate.getDate());

          /*
           if(dt.getTime() < now.getTime()) {
           Messages.error("Can't select dates in the past");
           return;
           }
           */
          calData.date = dt;
          App.popView(calData);
        });

      },
      activate: function(params, data) {
        calData = data || {}, calDate = calData.date ? new Date(calData.date.getTime()) : new Date();
        updateCalendarData();
      }
    };
  }
});