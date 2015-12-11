/* global TechService, Application, Events */
Application.addRoute("/main", {
  id: "mainView",
  factory: function (App, viewUi) {
    var Notification = App.Notification,
        Navigation = App.Navigation,
        sampleChart,
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
    
    function initializeChart() {
      var canvas = $("#sampleChart"), 
          canvasElem = canvas.get(0);
      sampleChart = new Chart(canvasElem.getContext('2d')).LabeledDoughnut([], {
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
    }
    
    function renderChart(data) {
      // update data
      sampleChart.setData({
        value: data.apples,
        color: chartTheme.criticalColor,
        label: "Apples"
      }, 0);
      sampleChart.setData({
        value: data.oranges,
        color: chartTheme.majorColor,
        label: "Oranges"
      }, 1);
      sampleChart.setData({
        value: data.vodka,
        color: chartTheme.minorColor,
        label: "Vokda!"
      }, 2);
      
      var total = Number(data.apples) + Number(data.oranges) + Number(data.vodka);
      total = isNaN(total) ? 0 : total;
      if(!total) {
        sampleChart.setData({
          value: 1,
          color: "#eee",
          label: ""
        }, 3);
      }else {
        sampleChart.setData({
          value: 0,
          color: "#eee",
          label: ""
        }, 3);
      }
      
      // set center label
      sampleChart.setCenterLabel(total);
      // update the chart
      sampleChart.update();
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
          type: "title",
          title: "DASHBOARD"
        }
      ],
      
      initialize: function () {
        Navigation.registerAction("logout", function() {
          App.popView(null, "/login");
        });
        
        initializeChart();
        renderChart({
          apples: 0,
          oranges: 0,
          vodka: 0
        });        
        
        var self = this;
        viewUi.on("transitionin", function() {
          self.onTransitionIn();
        });
      },
      
      activate: function (routeParams, viewData) {
      },
      
      onTransitionIn: function() {
        renderChart({
          apples: Math.round(Math.random() * 10),
          oranges: Math.round(Math.random() * 10),
          vodka: Math.round(Math.random() * 10)
        });
      },
      
      deactivate: function () {
        // issueChart.clear();
      },
      
      destroy: function () {
      }
    };
  }
});
