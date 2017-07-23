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
	this.tooltip = {
		borderWidth : 0,
		useHTML : true,
		style : {
			padding : 0
		},
		formatter : function() {
			return "<b>Time : </b>" + Highcharts.dateFormat('%H:%M:%S', this.x) + "<br> <b>" + this.series.name
					+ " : </b> " + Math.floor(this.y);
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
function EnergyUsageGraphOption() {
	$.extend(true, this, new UsageGraphOption());

	this.chart.type = 'areaspline';
	this.chart.renderTo = 'container';

	this.title.text = "Today's Energy Usage and Cost";
	this.subtitle.text = Date.today().toString('MMM dd, yyyy');

	this.yAxis = [ {
		title : {
			text : 'Energy Usage/Cost'
		},
		labels : {
			enabled : true
		}
	}, {
		title : {
			text : '$'
		}
	} ];
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
		endOnTick : true,
		tickInterval : 5 * 60 * 60 * 1000,
		tickPositions : [ Date.today().getTime(), Date.today().addHours(6).getTime(),
				Date.today().addHours(12).getTime(), Date.today().addHours(18).getTime(),
				Date.today().addHours(24).getTime() ]
	};
	this.plotOptions = {
		series : {
			color : '#0080ff',
			lineWidth : 1

		}
	}

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

function drawCurrentTimeline() {
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
				text : "<div><b>(" + Highcharts.dateFormat('%H:%M:%S', new Date().getTime()) + ")</b></div>",
				style : {
					color : '#8c8888',
					fontWeight : 'bold',
					fontSize : '30'
				}
			}
		});
	} else {
		chart.xAxis[0].removePlotLine('current-timeline');
	}
	hasPlotLine = !hasPlotLine;
};

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

Highcharts.setOptions({
	global : {
		useUTC : false
	}
});
/** ********************************************************************* */
var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $interval, $http) {

	$scope.object = null;
	$scope.energyData = null;
	var container = $('#container');
	$scope.redraw = function() {
		var data = $scope.dataTillNow();
		container.highcharts().destroy();
		$scope.object.series = $scope.series;
		chart = new Highcharts.StockChart($scope.object);
	};

	$scope.getPrice = function(time) {
		var date = new Date(time);
		var hour = date.getHours();
		if ((hour >= 7 && hour < 11) || (hour >= 17 && hour < 19)) {
			return 13.2;
		} else if ((hour >= 11 && hour < 17)) {
			return 18;
		} else {
			return 8.7;
		}
	};

	$scope.dataTillNow = function(_nowsec) {
		var _starttime = Date.today().getTime();
		var _endtime = Date.today().set({
			hour : 23,
			minute : 59,
			second : 59,
			millisecond : 0
		}).getTime();
		var energyData = [], costData = [], i = 0;
		while (_starttime <= _nowsec) {
			energyData.push([ _starttime, $scope.energyData[i] ]);
			costData.push([ _starttime, ($scope.energyData[i] / (60 * 1000) * $scope.getPrice(_starttime)) ]);
			i++;
			_starttime += 60 * 1000;
		}
		return {
			energyData : energyData,
			costData : costData
		};
	};

	$scope.createGraph = function(edata, pdata) {
		var chartOption = new EnergyUsageGraphOption();
		var gradientSpace = {
			x1 : 1,
			y1 : 0,
			x2 : 1,
			y2 : 1
		};
		var _series = [];
		_series.push({
			name : 'Energy',
			data : edata,
			zoneAxis : 'x',
			animation : {
				duration : 5000
			},
			zones : [ {
				value : Date.today().addHours(7),
				fillColor : {
					linearGradient : gradientSpace,
					stops : [ [ 0, 'rgb(135, 181, 76)' ], [ 1, 'rgba(135, 181, 76,0)' ] ]
				}
			}, {
				value : Date.today().addHours(11),
				color : {
					linearGradient : gradientSpace,
					stops : [ [ 0, 'rgb(246, 208, 35)' ], [ 1, 'rgba(246, 208, 35,0)' ] ]
				}
			}, {
				value : Date.today().addHours(17),
				color : {
					linearGradient : gradientSpace,
					stops : [ [ 0, 'rgb(196, 84, 75)' ], [ 1, 'rgb(224, 163, 159)' ] ]
				}
			}, {
				value : Date.today().addHours(19),
				color : {
					linearGradient : gradientSpace,
					stops : [ [ 0, 'rgb(221, 183, 10)' ], [ 1, 'rgb(250, 233, 158)' ] ]
				}
			}, {
				value : Date.today().addHours(23),
				color : {
					linearGradient : gradientSpace,
					stops : [ [ 0, 'rgb(135, 180, 81)' ], [ 1, 'rgb(194, 217, 166)' ] ]
				}
			} ],
		});

		_series.push({
			name : 'Cost',
			data : pdata,
			yAxis : 1,
			fillColor : {
				linearGradient : {
					x1 : 0,
					y1 : 0,
					x2 : 0,
					y2 : 1
				},
				stops : [ [ 0, Highcharts.getOptions().colors[0] ],
						[ 1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba') ] ]
			}
		});
		chartOption.series = _series;
		chart = new Highcharts.chart(chartOption);

	};
	$scope.updateGraph = function(edata, pdata) {
		var eseries = chart.series[0];
		eseries.addPoint(edata, true);

		var pseries = chart.series[1];
		pseries.addPoint(pdata, true);
	}
	$scope.fetchInitialUsageData = function() {
		$scope.createGraph([], []);
		$http.get('data/dataPerSec_1.json').then(function(res) {
			$scope.energyData = res.data;
			$scope.usageEndTime.addSeconds(10);
			$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());

			$scope.createGraph($scope.seriesData.energyData, $scope.seriesData.costData);

		});
	}
	$scope.realtimeUsageData = function() {
		$scope.usageEndTime.addSeconds(10);
		$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
		$scope.totalCost = _.reduce($scope.seriesData.costData, function(memo, num) {
			return memo + num[1]
		}, 0);
		$scope.updateGraph($scope.seriesData.energyData[$scope.seriesData.energyData.length - 1],
				$scope.seriesData.costData[$scope.seriesData.costData.length - 1]);
	}
	$scope.usageEndTime = Date.today().setTimeToNow();
	$scope.fetchInitialUsageData();
	$interval(function() {
		console.log('fetch data');
		$scope.realtimeUsageData();
	}, 1000);
	window.setInterval(function() {
		drawCurrentTimeline();
	}, 1000);
});
