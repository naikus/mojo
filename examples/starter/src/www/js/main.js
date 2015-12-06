/* global TechService, Application, Events */
Application.addRoute("/main", {
  id: "mainView",
  factory: function (App, viewUi) {
    var userProfile, 
        userProfileSummaryBinder = $("#userProfileSummaryBinding").binder(),
        mainNavListBinder = $("#mainNavListBinding").binder({
          model: {
            issues: {
              MAJOR: 0,
              MINOR: 0,
              CRITICAL: 0
            },
            unreadMessages: 0
          }
        }),
        Notification = window.Notification,
        Navigation = App.Navigation,
        issueChart,
        recentSchedulesSection, 
        recentScheduleList,
        chartTheme = {
          criticalColor: "#d65353",
          majorColor: "#f4ba46",
          minorColor: "#a3c950",
          
          // dark theme
          // segmentStrokeColor: "#304060", 
          // centerLabelColor: "#e5eaf3"
          
          // light theme
          segmentStrokeColor: "rgba(0,0,0,0.05)", 
          centerLabelColor: "rgba(81,91,116,0.8)"
        };
    
    
    function fetchIssueSummary(callback) {
      TechService.fetchIssueSummary(userProfile.id, "open", 
          function(data) {
            callback(data);
          },
          function(code, xhr) {
            console.log(code);
            Notification.error("Error fetching issue summary");
          }
      );
    }
    
    function fetchMessageSummary() {
      TechService.fetchMessageSummary(userProfile.id, 
          function(data) {
            mainNavListBinder.update("unreadMessages", data.unread || 0);
          }, 
          function(code, xhr) {
            console.log(code);
            Notification.error("Error fetching message summary");
          }
      );
     
      // @Todo Testing only!!
      // mainNavListBinder.update("unreadMessages", 22);
    }
    
    function fetchRecentSchedules() {
      TechService.fetchScheduleSummary(userProfile.id, 
          function(data) {
            recentScheduleList.setItems(data);
            if(data.length) {
              recentSchedulesSection.removeClass("no-content");
            }else {
              recentSchedulesSection.addClass("no-content");
            }
          }, 
          function(code, xhr) {
            console.log(code);
            Notification.error("Error fetching recent schedules");
          }
      );
      // @Todo Testing only!!
      /*
      recentScheduleList.setItems([
        {
          "id": 10,
          "userDto": {
            "customerName": "Robert Brown",
            "customerId": 5,
            "accountType": "SILVER",
            "address": {
              "addressLine1": "Mountain Village",
              "addressLine2": null,
              "street": "Main Street North",
              "city": "Phoenix",
              "state": "Arizona",
              "country": "USA",
              "zipCode": 85592
            },
            "email": "robertbrown@email.com",
            "phoneNumber": "480-123-3255",
            "avatar": "/users/4/avatar",
            "openIssueCount": 3
          },
          "issue": {
            "id": 1,
            "severity": "MAJOR",
            "type": "Maintainance",
            "summary": "Oven door hinge and fan problem"
          },
          "status": "OPEN",
          "dateTime": 1448436579873,
          "issueId": 10,
          "description": "Schedule for issue id 10"
        },
        {
          "id": 2,
          "userDto": {
            "customerName": "Johnny English",
            "customerId": 2,
            "accountType": "SILVER",
            "address": {
              "addressLine1": "Pacito Terrace",
              "addressLine2": null,
              "street": "Main Street",
              "city": "San Jose",
              "state": "California",
              "country": "USA",
              "zipCode": 95101
            },
            "email": "johnnyenglish@email.com",
            "phoneNumber": "408-123-5555",
            "avatar": "/users/1/avatar",
            "openIssueCount": 3
          },
          "issue": {
            "id": 2,
            "severity": "major",
            "type": "Maintainance",
            "summary": "Oven thermostat problem"
          },
          "status": "OPEN",
          "dateTime": 1448436578960,
          "issueId": 2,
          "description": "Schedule for issue id 2"
        }
      ]);
      */
    }
    
    function buildCustomerAddress(address) {
      return [
        address.addressLine1 +  (address.addressLine2 || ""),
        address.street || "",
        address.city || "",
        address.zipCode || "",
        address.state || "",
        address.country || ""
      ].join(" ");
    }
    
    function initializeChart() {
      var canvas = $("#issueChart"), 
          canvasElem = canvas.get(0);
      issueChart = new Chart(canvasElem.getContext('2d')).K2Doughnut([], {
        responsive: false,
        animation: true,
        centerLabel: "0",
        centerLabelColor: chartTheme.centerLabelColor,
        centerLabelFont: "700 3.5em Raleway",
        percentageInnerCutout: 65,
        animationSteps: 20,
        animationEasing: "easeOutCubic",
        segmentStrokeColor: chartTheme.segmentStrokeColor,
        segmentStrokeWidth : 3
      });
      
      canvas.on(Events.tap, function() {
        App.showView("/issues");
      });
    }
    
    function renderChart(issueSummary) {
      // update data
      issueChart.setData({
        value: issueSummary.CRITICAL,
        color: chartTheme.criticalColor,
        label: "Critical"
      }, 0);
      issueChart.setData({
        value: issueSummary.MAJOR,
        color: chartTheme.majorColor,
        label: "Major"
      }, 1);
      issueChart.setData({
        value: issueSummary.MINOR,
        color: chartTheme.minorColor,
        label: "Minor"
      }, 2);
      
      var total = Number(issueSummary.CRITICAL) + Number(issueSummary.MAJOR) + Number(issueSummary.MINOR);
      total = isNaN(total) ? 0 : total;
      if(!total) {
        issueChart.setData({
          value: 1,
          color: "#eee",
          label: "No Issues"
        }, 3);
      }else {
        issueChart.setData({
          value: 0,
          color: "#eee",
          label: "No Issues"
        }, 3);
      }
      
      // set center label
      issueChart.setCenterLabel(total);
      // update the chart
      issueChart.update();
    }
    
    function startNotificationChannel() {
      App.NotificationChannel = new window.SSEChannel({
        url: TechService.serverUrl() + "/api/notifications"
      });
      App.NotificationChannel.open();
      App.NotificationChannel.on("error", function(e) {
        console.log(e);
        Notification.warn("Notification channel unavailabe. Will retry after some time");
      });
      $(window).on("beforeunload", function() {
        console.log("Closing notfication channel");
        App.NotificationChannel.close();
      });
    }
    
    return {
      actions: [
        {
          type: "action",
          icon: "icon icon-menu",
          handler: function () {
            Navigation.toggle();
          }
        },
        {
          type: "other",
          title: '<img class="toolbar-logo" alt="" src="images/k2_toolbar.png" />'
        },
        {
          type: "title",
          title: "LEVEL 2 SUPPORT"
        }
      ],
      
      initialize: function () {
        userProfile = TechService.currentUser().profile;
        // Set username and image in navigation menu
        userProfileSummaryBinder.apply({
          name: userProfile.fullName,
          avatar: TechService.serverUrl() + "/api/users/" + userProfile.id + "/avatar"
        });
        
        Navigation.registerAction("logout", function() {
          TechService.logout();
          App.NotificationChannel.close();
          App.popView(null, "/login");
        });
        
        initializeChart();
        renderChart({
          CRITICAL: 0,
          MAJOR: 0,
          MINOR: 0
        });
        
        var itemTemplate = $("#scheduleItemTemplate").template();
        recentScheduleList = $("#recentScheduleList").datalist({
          selectable: false,
          listClass: "list bordered pad-items",
          itemClass: "activable schedule-item",
          render: function(list, li, index, schedule) {
            var time = schedule.dateTime;
            schedule.customerAddress = buildCustomerAddress(schedule.customer.address);
            schedule.formattedDate = Utils.getFormattedDate(new Date(time), true, true);
            schedule.issue.type = schedule.issue.type || schedule.issue.severity;
            li.addClass(schedule.issue.severity);
            return itemTemplate.process(schedule);
          }
        });
        recentScheduleList.on(Events.tap, function(e, uiItem, schedule) {
          window.open("http://maps.google.com/?q=" 
              + encodeURIComponent(schedule.customerAddress), '_system');
        });
        
        recentSchedulesSection = $("#recentSchedulesSection");
        
        // start listening to server sent events
        startNotificationChannel();
        
        var self = this;
        viewUi.on("transitionin", function() {
          self.onTransitionIn();
        });
      },
      
      activate: function (routeParams, viewData) {
        userProfile = TechService.currentUser().profile;
        // Set username and image in navigation menu
        userProfileSummaryBinder.apply({
          name: userProfile.fullName,
          avatar: TechService.serverUrl() + "/api/users/" + userProfile.id + "/avatar"
        });
      },
      
      onTransitionIn: function() {
        fetchIssueSummary(function(data) {
          mainNavListBinder.update("issues", data);
          // data.CRITICAL = data.MAJOR = data.MINOR = 0;
          renderChart(data);
        });
        fetchMessageSummary();
        fetchRecentSchedules();
      },
      
      deactivate: function () {
        // issueChart.clear();
      },
      
      destroy: function () {
        App.NotificationChannel.close();
      }
    };
  }
});
