/* global Chart */
/**
 * A custom doughnut chart based on chargjs.org doughnut
 * @author aniketn3@gmail.com
 */
Chart.types.Doughnut.extend({
    // Passing in a name registers this chart in the Chart namespace in the same way
    name: "LabeledDoughnut",
    centerLabel: "",
    initialize: function(data){
      this.centerLabel = this.options.centerLabel;
      Chart.types.Doughnut.prototype.initialize.apply(this, arguments);
    },
    
    setData: function(data, index) {
      var segments = this.segments;
      if(index >= segments.length) {
        this.addData(data);
      }else {
        var segment = segments[index];
        segment.value = data.value || 0;
        if(data.color) {segment.fillColor = data.color;}
        if(data.label) {segment.label = data.label;}
      }
    },
    
    removeAllData: function(bUpdate) {
      for(var i = 0, len = this.segments.length; i < len; i++) {
        this.removeData();
      }
      if(bUpdate !== false) {
        this.update();
      }
    },
    
    draw: function() {
      Chart.types.Doughnut.prototype.draw.apply(this, arguments);
      
      var x = Math.floor(this.chart.width / 2),
          y = Math.floor(this.chart.height / 2),
          ctx = this.chart.ctx;
      
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = this.options.centerLabelFont || "700 3.5em Raleway";
      ctx.strokeStyle = this.options.centerLabelColor || "#666666";
      ctx.fillStyle = this.options.centerLabelColor || "#666666";
      /*
      var textBoundingBoxWidth = Math.floor(this.chart.width * 30 / 100),
          textBoundingBoxHeight = Math.floor(this.chart.height * 30 / 100);
      ctx.strokeRect(x - (textBoundingBoxWidth/2), 
          y - (textBoundingBoxHeight/2), textBoundingBoxWidth, textBoundingBoxHeight);
      */
      ctx.fillText(this.centerLabel, x, y);
    },
    
    setCenterLabel: function(text) {
      this.centerLabel = text;
      this.update();
    }
});
