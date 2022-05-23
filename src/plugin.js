import {Chart} from 'chart.js'

var thresholdPlugin = {

  id: 'threshold',

  afterInit: function(chart) {
  },

  destroy: function(chart) {
  },

  beforeDatasetsUpdate: function(chart) {
    // gather datasets that act as threshold 
    var thresholds = []
    for(var dataset of chart.data.datasets) {
      if (dataset.threshold) {
        thresholds.push(dataset)
      }
      if(dataset.originalBackgroundColor == undefined) {
        dataset.originalBackgroundColor = dataset.backgroundColor
      }
    }

    if(thresholds.length == 0) { return }

    // loop through datasets, update colors
    for(var dataset of chart.data.datasets) {
      if(dataset.noThresh || dataset.threshold || dataset.showLine) {
        continue
      }

      var backgroundColors = []

      for(var point of dataset.data) {

        var matched = ""

        for(var threshold of thresholds) {
          var index = threshold.data.findIndex(function(o) { return o.x >= point.x})

          if (index == -1) { continue }
          // get value at index
          var value = (index > 0) ? threshold.data[index-1].y : threshold.data[index].y

          if (this.evaluateRule(point.y, threshold.threshold, value)) {
            matched = threshold.borderColor
          }
        }

        if(matched == "") {
          backgroundColors.push(dataset.originalBackgroundColor)
        } else {
          backgroundColors.push(matched)
        }
      }

      dataset.pointBackgroundColor = backgroundColors
      dataset.pointBorderColor = backgroundColors

      if (dataset.type == 'bar' || chart.config.type == 'bar') {
        dataset.borderColor = backgroundColors
        dataset.backgroundColor = backgroundColors
      }

    }

  },

  evaluateRule: function(value, rule, rule_value) {

    switch(rule) {
      case "ge":
        return value >= rule_value
      case "gt":
        return value > rule_value
      case "lt":
        return value < rule_value
      case "le":
        return value <= rule_value
      default:
        return false
    }

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
    // this.fixLegendColors(chart)
    return true
  },

}

Chart.register(thresholdPlugin);
