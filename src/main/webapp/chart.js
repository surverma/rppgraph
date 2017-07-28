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
function EnergyUsageGraphOption() {
	$.extend(true, this, new UsageGraphOption());

	this.chart.type = 'areaspline';
	this.chart.renderTo = 'container';

	this.title.text = "Today's Energy Usage and Cost";
	this.subtitle.text = Date.today().toString('MMM dd, yyyy');

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
			format: '{value} cent',
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
				Date.today().addHours(20).getTime()]
	};
	this.tooltip = {
			borderWidth : 0,
			useHTML : true,
			style : {
				padding : 0,
			},
			formatter : function() {
				var interval = this.points[0].point.z.timeInterval;
				var text = "<b>Time : </b>" + Highcharts.dateFormat('%I:%M:%S %p', this.x) +
				"( " + interval + (interval>1? " minutes": " minute")+ " )<br>";
				$.each(this.points, function(i, point) {
					text = text + "<b>" + point.series.name;
					if(point.series.name == "Energy")
						text = text + " : </b> " + (point.y * 1000) + " wh<br>"; 
					if(point.series.name == "Cost")
						text = text + " : </b> " + (point.y * point.point.z.offPeakFactor).toFixed(2) + "&cent;<br>";
					if(point.series.name == "Cumulative cost")
						text = text + " : </b> " + (point.y).toFixed(2) + "&cent;<br>";
				});
				return text;
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

function drawCurrentTimeline() {
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
		$scope.createGraph(data.energyData,data.costData,data.cumCostData);
	};

	$scope.breakTotalCost = function(costData)
	{
		var off_peak = null;
		var on_peak = null;
		var mid_peak = null;

		$.each(costData, function( index, value ) {
			if(getCostZone(value[0]) == "off")
			{
				off_peak += value[1];
			}
			else if(getCostZone(value[0]) == "mid")
			{
				mid_peak += value[1];
			}
			else
			{
				on_peak += value[1];
			}
		});

		return {
			offCost : off_peak,
			midCost : mid_peak,
			onCost : on_peak
		};

	};

	$scope.findHoliday = function(time)
	{
		var isHoliday = false;
		$.each($scope.holidayList, function(key,holiday) {
			var gmtDate = new Date(holiday.holidayDate);
			var estDate = gmtDate.addHours(gmtDate.getTimezoneOffset()/60);
			if(Date.compare(new Date(time),estDate) == 0)
			{
				isHoliday = true;
				return true;
			}
		});
		return isHoliday;
	};


	$scope.getEnergyCost = function(time) {
		var inputDay = new Date(time).getDay();
		var inputHour = new Date(time).getHours();
		var isWeekend = (inputDay == 6) || (inputDay == 0); 
		var costZone = null;
		var dateFilter = _.filter($scope.costBreakup, function(singleRow){ 
			if(time >=singleRow.effDate && time<=singleRow.endDate)
			{
				return singleRow;
			}
		});

		if(isWeekend)
		{
			costZone = _.filter(dateFilter, function(singleRow){
				if(singleRow.season == "Weekend") return singleRow;
			});
		}
		else if($scope.isHoliday)
		{
			costZone = _.filter(dateFilter, function(singleRow){
				if(singleRow.season == "Holiday") return singleRow;
			});
		}
		else
		{
			costZone = _.filter(dateFilter, function(singleRow){
				var splitedEffHour = singleRow.effHour.split(":")[0];
				var splitedEndHour = singleRow.endHour.split(":")[0];

				if(singleRow.season == "Summer")
				{
					if(splitedEffHour < splitedEndHour)
					{
						if(inputHour >= splitedEffHour && inputHour < splitedEndHour)
							return singleRow;
					}
					else
					{
						if((inputHour >= splitedEffHour &&  inputHour <= 23) ||  (inputHour >= 0 &&  inputHour < splitedEndHour))
							return singleRow;
					}
				}

			});
		}
		return costZone[0].price;
	};



	$scope.dataTillNow = function(_nowsec) {
		var _today = Date.today().getTime();
		var _cumCost = 0;
		var _zObject = {};
		var _datadate = Date.today().clearTime().set({
			year : 2017,
			month : 6,
			day : 12
		}).getTime();
		var delta = _today - _datadate + 4*3600*1000;
		var energyData = [], costData = [], cumCostData = [], i = 0;
		_zObject.offPeakFactor = $scope.offPeakFactor;
		for (i = 0; i < $scope.energyData.length; i++) {
			var utime = delta+$scope.energyData[i][0] * 1000;
			if(i>0)
			{
				var prevUtime = delta+$scope.energyData[i-1][0] * 1000;
				_zObject.timeInterval =  (utime - prevUtime)/(1000*60); //minute
			}
			else
			{
				_zObject.timeInterval = 0;
			}
			_cumCost += (($scope.energyData[i][1]/1000) * $scope.getEnergyCost(utime) * (_zObject.timeInterval/60)); // (kwh * c/kwh * hour)

			energyData.push({
				x : utime,
				y : ($scope.energyData[i][1]/1000),
				z : _zObject
			}); //kwh

			costData.push({
				x : utime,
				y : ($scope.energyData[i][1]/1000) * ($scope.getEnergyCost(utime)/$scope.offPeakFactor), // ()
				z : _zObject
			});//cent/kwh

			cumCostData.push({
				x : utime,
				y : _cumCost,
				z : _zObject
			}); //cent
		}
		return {
			energyData : energyData,
			costData : costData,
			cumCostData : cumCostData
		};
	};

	$scope.createGraph = function(edata, pdata, cdata) {
		var chartOption = new EnergyUsageGraphOption();
		var gradientSpace = {
				x1 : 1,
				y1 : 0,
				x2 : 1,
				y2 : 1
		};
		
		var _zonesWithColorGrad = [ {
			value : Date.today().addHours(7),
			fillColor : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(135, 181, 76)' ], [ 1, 'rgb(135, 181, 76)' ] ]
			}
		}, {
			value : Date.today().addHours(11),
			color : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(246, 208, 35)' ], [ 1, 'rgb(246, 208, 35)' ] ]
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
			value : Date.today().addHours(24),
			color : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(135, 180, 81)' ], [ 1, 'rgb(194, 217, 166)' ] ]
			}
		} ];
		
		var _zonesWithSolidColor = [ {
			value : Date.today().addHours(7),
			color : 'rgb(135, 181, 76)'
		}, {
			value : Date.today().addHours(11),
			color : 'rgb(246, 208, 35)'
		}, {
			value : Date.today().addHours(17),
			color : 'rgb(196, 84, 75)'
		}, {
			value : Date.today().addHours(19),
			color : 'rgb(221, 183, 10)'
		}, {
			value : Date.today().addHours(24),
			color : 'rgb(135, 180, 81)'
		} ];
		
		var _series = [];
		_series.push({
			name : 'Energy',
			data : edata,
			zoneAxis : 'x',
			zones : _zonesWithSolidColor,
			fillOpacity: 0.7
			
		});

		_series.push({
			name : 'Cost',
			data : pdata,
			yAxis : 0,
			/*fillColor : {
				linearGradient : {
					x1 : 0,
					y1 : 0,
					x2 : 0,
					y2 : 1
				},
				stops : [ [ 0, Highcharts.getOptions().colors[0] ],
					[ 1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba') ] ]
			}*/
			zoneAxis : 'x',
			zones : _zonesWithSolidColor,
			fillOpacity: 0.5
		});

		_series.push({
			name : 'Cumulative cost',
			data : cdata,
			type : 'line',
			yAxis : 1,
			color : '#a05403',
			lineWidth : 1
		});
		chartOption.series = _series;
		chart = new Highcharts.chart(chartOption);

	};

	$scope.createPieGraph = function(breakUpCost,totalCost) {
		var chartOption = new EnergyPulseMonitorOption();
		var _series = [
			/*{
		        name: 'Critical',
		        data: [{
		            color: Highcharts.getOptions().colors[5],
		            radius: '112%',
		            innerRadius: '88%',
		            y: 70
		        }]
		    },*/ 
			{
				name: 'On-Peak',
				data: [{
					color: Highcharts.getOptions().colors[1],
					radius: '112%',
					innerRadius: '88%',
					y: ((breakUpCost.onCost + breakUpCost.midCost + breakUpCost.offCost)*100/totalCost)
				}]
			},
			{
				name: 'Mid-Peak',
				data: [{
					color: Highcharts.getOptions().colors[2],
					radius: '112%',
					innerRadius: '88%',
					y: ((breakUpCost.midCost + breakUpCost.offCost)*100/totalCost)
				}]
			}, 
			{
				name: 'Off-Peak',
				data: [{
					color: Highcharts.getOptions().colors[0],
					radius: '112%',
					innerRadius: '88%',
					y: (breakUpCost.offCost*100/totalCost)
				}]
			}
			/*,

		    {
		        name: 'Goal',
		        data: [{
		            color: Highcharts.getOptions().colors[8],
		            radius: '87%',
		            innerRadius: '63%',
		            y: 65
		        }]
		    }, {
		        name: 'Average',
		        data: [{
		            color: Highcharts.getOptions().colors[9],
		            radius: '62%',
		            innerRadius: '38%',
		            y: 50
		        }]
		    }*/];
		chartOption.series = _series;
		console.log("Pie chart options",chartOption);
		pie_chart = new Highcharts.chart(chartOption);

	};
	$scope.updateGraph = function(edata, pdata, cdata) {
		var eseries = chart.series[0];
		eseries.addPoint(edata, true);

		var pseries = chart.series[1];
		pseries.addPoint(pdata, true);

		var cseries = chart.series[2];
		cseries.addPoint(cdata, true);
	};
	$scope.updatePulseMeter= function(breakUpCost,totalCost) {
		if(pie_chart)
		{
			pie_chart.series[0].points[0].update((breakUpCost.onCost + breakUpCost.midCost + breakUpCost.offCost)*100/totalCost);
			pie_chart.series[1].points[0].update((breakUpCost.midCost + breakUpCost.offCost)*100/totalCost);
			pie_chart.series[2].points[0].update(breakUpCost.offCost*100/totalCost);
		}
		console.log("Updating pulse graph",pie_chart);
	};
	$scope.fetchInitialUsageData = function() {
		$scope.createGraph([], [], []);
		$http.get('data/energyDataRandomInterval.json').then(function(res) {
			$http({
				method: 'GET',
				url: 'https://rppapi-dot-api-dot-lh-myaccount-dev.appspot.com/api/v1/public/touSchedules'
			})
			.then(
					function successCallback(res1) {
						$http({
							method: 'GET',
							url: 'https://api-dot-lh-myaccount-dev.appspot.com/api/v1/cms/lhHolidays?year=2017'
						})
						.then(
								function successCallback(res2) {
									$scope.costBreakup = res1.data;
									$scope.energyData = res.data;
									$scope.usageEndTime.addSeconds(10);
									$scope.holidayList = res2.data;
									$scope.isHoliday = $scope.findHoliday($scope.usageEndTime.clearTime().getTime());
									var peakFilter = _.filter($scope.costBreakup, function(singleRow){ 
										if(singleRow.peak == "TOU_OP")
										{
											return singleRow;
										}
									});
									$scope.offPeakFactor = peakFilter[0].price;

									$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
									$scope.createGraph($scope.seriesData.energyData, $scope.seriesData.costData, $scope.seriesData.cumCostData);

									$scope.totalCost = _.reduce($scope.seriesData.costData, function(memo, num) {
										return memo + num[1]
									}, 0);
								},
								function errorCallback(response) {

								});
					},
					function errorCallback(response) {

					});

			//var breakUpCost = $scope.breakTotalCost($scope.seriesData.costData);
			//$scope.createPieGraph(breakUpCost,$scope.totalCost);

		});
	}
	$scope.realtimeUsageData = function() {
		$scope.usageEndTime.addMinutes(5);
		$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
		$scope.totalCost = _.reduce($scope.seriesData.costData, function(memo, num) {
			return memo + num[1]
		}, 0);
		//var breakUpCost = $scope.breakTotalCost($scope.seriesData.costData);
		$scope.updateGraph($scope.seriesData.energyData[$scope.seriesData.energyData.length - 1],
				$scope.seriesData.costData[$scope.seriesData.costData.length - 1],
				$scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length - 1]);
		//$scope.updatePulseMeter(breakUpCost,$scope.totalCost);
	}
	$scope.usageEndTime = Date.today().setTimeToNow();
	$scope.fetchInitialUsageData();
	$interval(function() {
		console.log('fetch data');
		$scope.realtimeUsageData();
	}, 1000);
	window.setInterval(function() {
		drawCurrentTimeline();
	}, 500);
});
