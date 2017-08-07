Highcharts.setOptions(
		{
			colors: ['#50B432', '#ED561B', '#DDDF00', '#24CBE5', '#64E572', '#FF9655', '#FFF263','#6AF9C4','#088DA5', '#DC143C']
		});

function UsageGraphOption() {
	this.enableCost = false;
	this.credits = {
			enabled : false
	};
	this.chart = {
			type : 'column',
			reflow : true,
	};
	this.title = {
			text : null
	};
	this.subtitle = {
			text : null
	};
	this.xAxis = {
			type : 'datetime',
			dateTimeLabelFormats : {
				millisecond : '%b %d, %Y',
				second : '%b %d, %Y',
				minute : '%b %d, %Y',
				hour : '%b %d, %Y',
				day : '%b %d, %Y',
				week : '%b %d, %Y',
				month : '%b %d, %Y',
				year : '%b %d, %Y'
			},
			labels : {
				rotation : -45,
				formatter : function() {
					return Highcharts.dateFormat('%b %d, %Y', this.value);
				}
			},
			tickPositioner : function(min, max) {
				var positions = [];
				if (this.series) {
					var data = this.series[0].data;
					for (i = 0; i < data.length; i++) {
						positions.push(data[i].x);
					}
				}
				return positions;
			}
	};
	this.yAxis = {
			unit : 'UNIT',
			title : {
				text : 'UNIT',
				color : "#00B0F4"
			},
			stackLabels : {
				enabled : true,
				style : {
					fontWeight : 'bold',
					color : (Highcharts.theme && Highcharts.theme.textColor) || '#525252',
					align : 'center'

				},
				formatter : function() {
					var userOptions = this.axis.chart.userOptions;
					console.log("userOptions.axis chart..", userOptions);
					if (userOptions.enableCost) {
						var data = this.axis.series[0].data;
						var _point = _.findWhere(data, {
							x : this.x
						});
						if (_point == null) {
							return "";
						}
						return '$' + Highcharts.numberFormat(_point.z, 0);
					}
				}
			}
	};
	this.legend = {
			enabled : true
	};
	this.plotOptions = {
			column : {
				stacking : 'normal',
				dataLabels : {
					enabled : true,
					color : (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
					rotation : 270,
					useHTML : true,
					style : {
						fontWeight : "normal",
						textShadow : false,
						textOutline : false
					},
					formatter : function() {
						// var _unit = this.series.chart.yAxis[0].options.unit;
						return Highcharts.numberFormat(this.total, 0); // + _unit;
					}
				}
			},
			series : {
				color : '#0080ff',
				lineWidth : 1

			}
	};

	this.exporting = {
			enabled : false
	};
	this.series = [];
}
UsageGraphOption.prototype.xBoundary = function(p1, p2) {
	if (p1) {
		this.xAxis.min = (new Date(p1.x)).addDays(-1).getTime();
	}
	if (p2) {
		this.xAxis.max = (new Date(p2.x)).addDays(1).getTime();
	}

}
function EnergyPulseMonitorOption() {
	$.extend(true, this, new UsageGraphOption());

	this.chart.type = 'solidgauge';
	this.chart.renderTo = 'pie_container';

	this.title.text = "Daily Energy Monitor";
	this.subtitle.text = Date.today().toString('MMM dd, yyyy');

	this.yAxis = {
			min: 0,
			max: 100,
			lineWidth: 0,
			tickPositions: []
	},
	/*this.xAxis = {
		min : Date.today().set({
			hour : 0,
			minute : 0
		}),
		max : Date.today().set({
			hour : 23,
			minute : 59
		}),
		labels : {
			formatter : timeSlabFormatter
		},
		endOnTick : true,
		tickInterval : 5 * 60 * 60 * 1000,
		tickPositions : [ Date.today().getTime(), Date.today().addHours(6).getTime(),
				Date.today().addHours(12).getTime(), Date.today().addHours(18).getTime(),
				Date.today().addHours(24).getTime() ]
	};*/
	this.tooltip = {
			borderWidth: 0,
			backgroundColor: 'none',
			shadow: false,
			style: {
				fontSize: '16px'
			},
			/*pointFormat: '{series.name}<br><span style="font-size:2em; color: {point.color}; font-weight: bold">' + this.y.toFixed(2) + '%</span>',*/
			formatter : function() {
				var text = this.series.name + "<br><span style='font-size:2em; color: {point.color}; font-weight: bold'>" + this.y.toFixed(2) + "%</span>";
				return text;
			},
			positioner: function (labelWidth) {
				return {
					x: 200 - labelWidth / 2,
					y: 180
				};
			}
	};
	this.plotOptions = {
			solidgauge: {
				dataLabels: {
					enabled: false
				},
				linecap: 'round',
				stickyTracking: false,
				rounded: true
			}
	};
	this.pane = {
			startAngle: 0,
			endAngle: 360,
			background: [

				{ // Track for Move 1
					outerRadius: '112%',
					innerRadius: '88%',
					backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[0])
					.setOpacity(0.3)
					.get(),
					borderWidth: 0
				}/*,        
				{ // Track for Move 2
					outerRadius: '112%',
					innerRadius: '88%',
					backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[0])
					.setOpacity(0.3)
					.get(),
					borderWidth: 0
				}, { // Track for Exercise
					outerRadius: '87%',
					innerRadius: '63%',
					backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[1])
					.setOpacity(0.3)
					.get(),
					borderWidth: 0
				}, { // Track for Stand
					outerRadius: '62%',
					innerRadius: '38%',
					backgroundColor: Highcharts.Color(Highcharts.getOptions().colors[2])
					.setOpacity(0.3)
					.get(),
					borderWidth: 0
				}*/]
	};

}


function EnergyUsageGraph(idata) {
	$.extend(true, this, new UsageGraph());
	this.data = idata;
	this.options = null;
	this.series = null;

	this.buildOption = function() {
		this.options = new EnergyUsageGraphOption();
		this.options.xBoundary(this.series[0].data[0], this.series[0].data[this.series[0].data.length - 1]);
	}
	this.buildSeries = function() {
		if (this.data == null) {
			return [ {} ];
		}

		var seriesData = _.sortBy(this.data.usageSummary, 'billPeriodMonth');
		console.log('	seriesData ', seriesData);
		var d = [];
		for (i = 0; i < seriesData.length; i++) {
			d.push({
				x : seriesData[i].billPeriodMonth.getTime(),
				y : seriesData[i].usageAmount,
				z : seriesData[i].chargeAmount,
			});
		}
		this.series = [ {
			data : d
		} ];
	}
	this.buildSeries();
	this.buildOption();
};

var hasPlotLine = false;
var chart = null;
var pie_chart = null;

/*function drawCurrentTimeline() {
	var position = null;
	if(new Date().getHours() > 20)
		position = -80;
	else
		position = 10;
	if (chart == null)
		return;
	if (!hasPlotLine) {
		chart.xAxis[0].addPlotLine({
			value : new Date().getTime(),
			color : 'black',
			width : 2,
			dashStyle : 'shortdash',
			id : 'current-timeline',
			label : {
				rotation : 0,
				x : position,
				text : "<div><b>(" + Highcharts.dateFormat('%I:%M:%S %p', new Date().getTime()) + ")</b></div>",
				style : {
					color : '#8c8888',
					fontWeight : 'bold',
					fontSize : '18'
				}
			}
		});
	} else {
		chart.xAxis[0].removePlotLine('current-timeline');
	}
	hasPlotLine = !hasPlotLine;
};*/

function getTimeSlab(date) {
	var myDate = new Date(date);
	if (myDate.getHours() == 23 || myDate.getHours() == 0) {
		return "midnight";
	}
	if (myDate.getHours() > 0 && myDate.getHours() <= 5) {
		return "early morning";
	}
	if (myDate.getHours() > 5 && myDate.getHours() < 12) {
		return "morning";
	}
	if (myDate.getHours() == 12) {
		return "noon";
	}
	if (myDate.getHours() > 12 && myDate.getHours() <= 16) {
		return "afternoon";
	}
	if (myDate.getHours() > 16 && myDate.getHours() < 23) {
		return "evening";
	}
}

function timeSlabFormatter() {
	return getTimeSlab(this.value);
}

function getCostZone(time)
{
	var date = new Date(time);
	var hour = date.getHours();
	if((hour >= 7 && hour < 11) || (hour >= 17 && hour < 19))
	{
		return 'mid';
	}
	else if((hour >= 11 && hour < 17))
	{
		return 'on';
	}
	else
	{
		return 'off';
	}
}

function createPieChartdata(pieData)
{
	var data =  [{
        name: 'Off Peak',
        y: pieData.offPeak,
        color: 'rgb(135, 181, 76)'
    }, {
        name: 'Mid Peak',
        y: pieData.midPeak,
        color: 'rgb(246, 208, 35)'
    }, {
        name: 'On Peak',
        y: pieData.onPeak,
        color: 'rgb(196, 84, 75)'
    }];
	
	return data;
}

Highcharts.setOptions({
	global : {
		useUTC : false
	}
});

function SmartMonitorGraphOption() {
	$.extend(true, this, new UsageGraphOption());

	this.chart.type = 'areaspline';
	this.chart.renderTo = 'smartMonitor_container';

	this.title.text = "Today's Demand";

	this.yAxis = [{
		title : {
			text : 'Demand per outlet (watts)'
		},
		labels : {
			enabled : true,
			 formatter: function () {
	                return this.value * 1000;
	            }
		}
	}
	];

	this.xAxis = {
			min : Date.today().set({
				hour : 0,
				minute : 0
			}),
			max : Date.today().set({
				hour : 23,
				minute : 59
			}),
			labels : {
				formatter : timeSlabFormatter
			},
			tickInterval : 5 * 60 * 60 * 1000,
			tickPositions : [ Date.today().getTime(), Date.today().addHours(6).getTime(),
				Date.today().addHours(12).getTime(), Date.today().addHours(16).getTime(),
				Date.today().addHours(20).getTime()]
	};
	
	this.chart.events = { load: function() {
		var position = null,
		plotLine,
		newx,
		d,
		xAxis = this.xAxis[0],
		rend = this.renderer;
		
		
		if((new Date().getHours() > 12 && new Date().getHours() < 15) || new Date().getHours() > 20)
			position = -150;
		else
			position = 20;
		xAxis.addPlotLine({
			value : new Date().getTime(),
			color : 'black',
			width : 2,
			dashStyle : 'solid',
			id : 'current-timeline',
			label : {
				rotation : 0,
				x : position,
				text : "<div><b>(" + Highcharts.dateFormat('%I:%M:%S %p', new Date().getTime()) + ")</b></div>",
				style : {
					color : '#8c8888',
					fontWeight : 'bold',
					fontSize : '18'
				}
			}
		});
		setInterval(function() {
			if(xAxis.plotLinesAndBands != undefined)
			{
			 plotLine = xAxis.plotLinesAndBands[0].svgElem;
			 d = plotLine.d.split(' ');
			 newx = xAxis.toPixels(new Date().getTime()) - d[4];
			 xAxis.plotLinesAndBands[0].label.textSetter("<div><b>(" + Highcharts.dateFormat('%I:%M:%S %p', new Date().getTime()) + ")</b></div>");
			 plotLine.animate({
	              translateX : newx
	            }, 300);
			}
		  }, 1000);
		}
	};
	
	this.tooltip = {
			borderWidth : 0,
			useHTML : true,
			style : {
				padding : 0,
			},
			formatter : function() {
					var text = "<b>Time : </b>" + Highcharts.dateFormat('%I:%M %p', this.x) + "<br>";
					$.each(this.points, function(i, point) {
						text = text + "<b>" + point.series.name;
							text = text + " : </b> " + (point.y * 1000) + " watts<br>"; 
					});
					return text;
				},
			shared : true
	};
	
	/*this.tooltip = {
        split: true,
        valueSuffix: ' watts'
    },*/
		
	this.plotOptions = {
			series : {
				//color : '#0080ff',
				lineWidth : 0

			}
	}

}


function EnergyPulseGraphOption() {
	$.extend(true, this, new UsageGraphOption());

	this.chart.type = 'areaspline';
	this.chart.renderTo = 'container';

	this.title.text = "Today's Energy Usage and Cost";

	this.yAxis = [{
		title : {
			text : 'Energy Usage/Cost'
		},
		labels : {
			enabled : false
		}
	},
	{
		title : {
			text : 'Cost'
		},
		labels: {
			format: '{value} ¢',
			style: {
				color: '#a05403'
			}
		},
		opposite : true
	}
	];

	this.xAxis = {
			min : Date.today().set({
				hour : 0,
				minute : 0
			}),
			max : Date.today().set({
				hour : 23,
				minute : 59
			}),
			labels : {
				formatter : timeSlabFormatter
			},
			tickInterval : 5 * 60 * 60 * 1000,
			tickPositions : [ Date.today().getTime(), Date.today().addHours(6).getTime(),
				Date.today().addHours(12).getTime(), Date.today().addHours(16).getTime(),
				Date.today().addHours(20).getTime()],
			plotBands : [{
				color: 'orange', // Color value
			from: Date.today().addHours(15).getTime(), // Start of the plot band
			to: Date.today().addHours(16).getTime(),
			label: { 
			    text: '<b>Critical</b><br> <b>Event</b>', // Content of the label. 
			    align: 'center' // Positioning of the label. 
			  }// End of the plot band
			}]
	};
	
	this.chart.events = { load: function() {
		var position = null,
		plotLine,
		newx,
		d,
		xAxis = this.xAxis[0],
		rend = this.renderer,
		pie = this.series[3],
		left = this.plotLeft + pie.center[0],
        top = this.plotTop + pie.center[1],
        totalCost = pie.yData[0] + pie.yData[1] + pie.yData[2];
        text = rend.text("¢<b>" + totalCost.toFixed(2) + "</b>", left,  top).attr({ 'text-anchor': 'middle'}).add();
		
		if((new Date().getHours() > 12 && new Date().getHours() < 15) || new Date().getHours() > 20)
			position = -140;
		else
			position = 10;
		xAxis.addPlotLine({
			value : new Date().getTime(),
			color : 'black',
			width : 2,
			dashStyle : 'solid',
			id : 'current-timeline',
			label : {
				rotation : 0,
				x : position,
				text : "<div><b>(" + Highcharts.dateFormat('%I:%M:%S %p', new Date().getTime()) + ")</b></div>",
				style : {
					color : '#8c8888',
					fontWeight : 'bold',
					fontSize : '18'
				}
			}
		});
		setInterval(function() {
			if(xAxis.plotLinesAndBands != undefined)
			{
			 plotLine = xAxis.plotLinesAndBands[1].svgElem;
			 d = plotLine.d.split(' ');
			 newx = xAxis.toPixels(new Date().getTime()) - d[4];
			 xAxis.plotLinesAndBands[1].label.textSetter("<div><b>(" + Highcharts.dateFormat('%I:%M:%S %p', new Date().getTime()) + ")</b></div>");
			 plotLine.animate({
	              translateX : newx
	            }, 300);
			}
		  }, 1000);
		}
	};
	
	this.tooltip = {
			borderWidth : 0,
			useHTML : true,
			style : {
				padding : 0,
			},
			formatter : function() {
				if(this.series != undefined && this.series.name == 'Total cost')
				{
					var text = "<b>" + this.key + " Cost</b><br>" + this.y.toFixed(2) + "&cent; (" + Math.round(this.percentage) + "%)";
					return text;
				}
				else
				{
					var interval = this.points[0].point.z.timeInterval;
					var text = "<b>Time : </b>" + Highcharts.dateFormat('%I:%M %p', this.x) +
					" (" + Math.round(interval) + (interval>1? " minutes": " minute")+ ")<br>";
					$.each(this.points, function(i, point) {
						text = text + "<b>" + point.series.name;
						if(point.series.name == "Energy")
							text = text + " : </b> " + (point.y * 1000) + " wh<br>"; 
						if(point.series.name == "Cost")
							text = text + " : </b> " + (((point.y * point.point.z.offPeakFactor)/ point.point.z.peakFactor)).toFixed(2) + "&cent;<br>";
						if(point.series.name == "Cumulative cost")
							text = text + " : </b> " + (point.y).toFixed(2) + "&cent;<br>";
					});
					return text;
				}
			},
			shared : true
	};
		
	this.plotOptions = {
			series : {
				//color : '#0080ff',
				lineWidth : 0

			}
	}

}
