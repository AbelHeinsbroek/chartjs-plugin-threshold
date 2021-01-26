var helpers = Chart.helpers

var tracePlugin = {

  afterInit: function(chart) {
  },

  destroy: function(chart) {
  },

  beforeDatasetsUpdate: function(chart) {


    if(!chart.options.threshold || chart.options.threshold.length == 0) {
      return true
    }

    for(var index in chart.data.datasets) {
      var dataset = chart.data.datasets[index]
      if(dataset.noThresh) {
        continue
      }
      if(dataset.originalBackgroundColor == undefined) {
        dataset.originalBackgroundColor = dataset.backgroundColor
      }
      var backgroundColors = []
      for(var pointIndex in dataset.data) {
        var y = dataset.data[pointIndex].y

        var matched = false
        for(var ruleIndex in chart.options.threshold) {
          var rule = chart.options.threshold[ruleIndex]
          if(this.evaluateRule(y, rule)) {
            backgroundColors.push(rule.color)
            matched = true
            break
          }
        }
        if(!matched) {
          backgroundColors.push(dataset.originalBackgroundColor)
        }
      }
      // line border color
      if(chart.config.type == 'bar') {
        dataset.borderColor = backgroundColors
        dataset.backgroundColor = backgroundColors
      } else {
        dataset.borderColor = this.calculateGradient(chart, dataset.backgroundColor)
      }
      dataset.pointBackgroundColor = backgroundColors
      dataset.pointBorderColor = backgroundColors
    }

    return true
  },

  evaluateRule: function(value, rule) {

    switch(rule.mode) {
      case "ge":
        return value >= rule.value
        break;
      case "gt":
        return value > rule.value
        break;
      case "lt":
        return value < rule.value
        break;
      case "le":
        return value <= rule.value
        break;
      default:
        return false
    }

  },

  calculateGradient: function(chart, baseColor) {

    var yScale = chart.scales[chart.getDatasetMeta(0).yAxisID];
    var gradient = chart.ctx.createLinearGradient(0, yScale.getPixelForValue(yScale.min), 0, yScale.getPixelForValue(yScale.max))

    var height = yScale.getPixelForValue(yScale.min) - yScale.getPixelForValue(yScale.max)

    var lower = 0
    var nextStop = 0
    var inserted = false

    var rules = chart.options.threshold.slice(0).sort(function(a,b) { return a.value - b.value })

    for(var ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      var rule = rules[ruleIndex]
      var stop = (yScale.getPixelForValue(rule.value) - yScale.getPixelForValue(yScale.max)) / height


      if(stop < 0) { stop = 0 }
      if(stop > 1) { stop = 1 }

      stop = 1-stop
      if(ruleIndex < rules.length-1) {
        nextStop = (yScale.getPixelForValue(rules[ruleIndex+1].value) - yScale.getPixelForValue(yScale.max)) / height
        if(nextStop > 1) { nextStop = 1 }
        if(nextStop < 0) { nextStop = 0 }
        nextStop = 1 - nextStop
      } else {
        nextStop = 1
      }


      if(rule.mode[0] == 'l') {
        gradient.addColorStop(lower, rule.color)
        gradient.addColorStop(stop, rule.color)
        lower = stop
      } 
      if(rule.mode[0] == 'g' && !inserted) {
        gradient.addColorStop(lower, baseColor)
        gradient.addColorStop(stop, baseColor)
        lower = stop
        inserted = true
      }
      if(rule.mode[0] == 'g') {
        gradient.addColorStop(lower, rule.color)
        gradient.addColorStop(nextStop, rule.color)
        lower = nextStop
      }
    }
    if(!inserted) {
      gradient.addColorStop(lower, baseColor)
      gradient.addColorStop(1, baseColor)
    }

    return gradient
  },

  fixLegendColors: function(chart) {
    if(!chart.legend.legendItems) {
      return
    }

    chart.config.data.datasets.forEach((dataset,i)=>{
      if(dataset.originalBackgroundColor){
        chart.legend.legendItems[i].fillStyle = dataset.originalBackgroundColor;
        chart.legend.legendItems[i].strokeStyle = dataset.originalBackgroundColor;
      }
    });
  },

  beforeDraw: function(chart) {

    if(!chart.options.threshold || chart.data.datasets.length == 0) {
      return true
    }


    for(var thresholdIndex in chart.options.threshold) {

      var threshold = chart.options.threshold[thresholdIndex]

      this.drawThresholdLine(chart, threshold.value, threshold.color)
    }


    this.fixLegendColors(chart)

    return true
  },


  drawThresholdLine: function(chart, value, color) {


    var yScale = chart.scales[chart.getDatasetMeta(0).yAxisID];
    var xScale = chart.scales[chart.getDatasetMeta(0).xAxisID];

    if(yScale.getPixelForValue(value) < yScale.getPixelForValue(yScale.max) || yScale.getPixelForValue(value) > yScale.getPixelForValue(yScale.min)) {
      // hide if outside scales
      return
    }

    chart.ctx.beginPath();
    chart.ctx.moveTo(xScale.getPixelForValue(xScale.min), yScale.getPixelForValue(value));
    chart.ctx.lineWidth = 1.5
    chart.ctx.strokeStyle = color;
    chart.ctx.lineTo(xScale.getPixelForValue(xScale.max), yScale.getPixelForValue(value));
    chart.ctx.stroke();
    chart.ctx.closePath();
  },
}

Chart.plugins.register(tracePlugin);
