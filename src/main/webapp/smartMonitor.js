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


var chart = null;

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

app.controller('myCtrl', function($scope, $interval, $http,$q) {

	var container = $('#container');
	$scope.redraw = function() {
		var data = $scope.dataTillNow();
		container.highcharts().destroy();
		$scope.createGraph(data);
	};
	
	$scope.dataTillNow = function(_nowsec) {
		var _today = Date.today().getTime();
		var _datadate = Date.today().clearTime().set({
			year : 2017,
			month : 6,
			day : 12
		}).getTime();
		
		var delta = _today - _datadate + 4*3600*1000;
		var outlet1 = [], outlet2 = [], outlet3 = [],i = 0;
		
		for (i = 0; i < $scope.outlet1.length; i++) {
			var _zOutlet1 = {};
			var _zOutlet2 = {};
			var _zOutlet3 = {};
			var utime = delta+$scope.outlet1[i][0] * 1000;
			var costZone = $scope.getEnergyCost(utime);
			
			if(i>0)
			{
				var prevUtime = delta+$scope.outlet1[i-1][0] * 1000;
				_zOutlet1.timeInterval =  (utime - prevUtime)/(1000*60); //minute
				_zOutlet1.cost =  outlet1[i-1].z.cost + (($scope.outlet1[i][1]/1000) * costZone.price); //cent
				_zOutlet1.increasedDemand =  (outlet1[i-1].y > ($scope.outlet1[i][1]/1000))? false:true ; 
				
				_zOutlet2.timeInterval =  (utime - prevUtime)/(1000*60); //minute
				_zOutlet2.cost =  outlet2[i-1].z.cost + (($scope.outlet2[i][1]/1000) * costZone.price); //cent
				_zOutlet2.increasedDemand =  (outlet2[i-1].y > ($scope.outlet2[i][1]/1000))? false:true ; 
				
				_zOutlet3.timeInterval =  (utime - prevUtime)/(1000*60); //minute
				_zOutlet3.cost =  outlet3[i-1].z.cost + (($scope.outlet3[i][1]/1000) * costZone.price); //cent
				_zOutlet3.increasedDemand =  (outlet3[i-1].y > ($scope.outlet3[i][1]/1000))? false:true ; 
			}
			else
			{
				_zOutlet1.timeInterval = 0;
				_zOutlet1.cost = 0;
				
				_zOutlet2.timeInterval = 0;
				_zOutlet2.cost = 0;
				
				_zOutlet3.timeInterval = 0;
				_zOutlet3.cost = 0;
			}
			
			
			outlet1.push({
				x : utime,
				y : ($scope.outlet1[i][1]/1000),
				z : _zOutlet1
			}); //kwh

			outlet2.push({
				x : utime,
				y : ($scope.outlet2[i][1]/1000), 
				z : _zOutlet2
			});//kwh

			outlet3.push({
				x : utime,
				y : ($scope.outlet3[i][1]/1000), 
				z : _zOutlet3
			}); //kwh
		}
		return {
			outlet1 : outlet1,
			outlet2 : outlet2,
			outlet3 : outlet3
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
	
	$scope.findWeekend = function(time)
	{
		var inputDay = new Date(time).getDay();
		var isWeekend = (inputDay == 6) || (inputDay == 0); 
		return isWeekend;
	};

	$scope.createGraph = function(energyData) {
		var chartOption = new EnergyUsageGraphOption();
		//chartOption.subtitle.text = Date.today().toLongDateString() + "<br>Today's Energy Cost : <b>¢" + $scope.totalCost.toFixed(2) + "</b>";
		chartOption.subtitle.text = Highcharts.dateFormat('%A, %B %d,%Y', Date.today()) ;
		
		var _series = [];
		
		_series.push({
			name : 'Outlet One',
			data : energyData.outlet1,
			fillColor : 'rgba(255, 51, 51, 0.7)'
		});
		
		_series.push({
			name : 'Outlet Two',
			data : energyData.outlet2,
			fillColor : 'rgba(230, 184, 0, 0.7)'
			
		});
		
		_series.push({
			name : 'Outlet Three',
			data : energyData.outlet3,
			fillColor : 'rgba(153, 153, 255, 0.7)'
			
		});
		
		chartOption.series = _series;
		chart = new Highcharts.chart(chartOption);

	};

	$scope.getEnergyCost = function(time) {
		var inputHour = new Date(time).getHours();
		var costZone = null;
		var finalZone = null;
		var dateFilter = _.filter($scope.costBreakup, function(singleRow){ 
			if(time >=singleRow.effDate && time<=singleRow.endDate)
				return singleRow;
		});

		if($scope.isWeekend)
		{
			costZone = _.filter(dateFilter, function(singleRow){
				if(singleRow.season == "Weekend")
				{
					//$scope.peakFactorCalculator(singleRow);
					return singleRow;
				}
			});
			finalZone = Object.create(costZone[0]);
		}
		else if($scope.isHoliday)
		{
			costZone = _.filter(dateFilter, function(singleRow){
				if(singleRow.season == "Holiday")
				{
					//$scope.peakFactorCalculator(singleRow);
					return singleRow;
				}
			});
			finalZone = Object.create(costZone[0]);
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
						{
							//$scope.peakFactorCalculator(singleRow);
							return singleRow;
						}
					}
					else
					{
						if((inputHour >= splitedEffHour &&  inputHour <= 23) ||  (inputHour >= 0 &&  inputHour <= splitedEndHour))
						{
							//$scope.peakFactorCalculator(singleRow);
							return singleRow;
						}
					}
				}

			});
			finalZone = Object.create(costZone[0]);
			/*if(inputHour == 15)	
			{
				finalZone.peak = "TOU_CE";
			}
			$scope.peakFactorCalculator(finalZone);*/
		}
		
		return finalZone;
	};
	
	$scope.updateGraph = function(o1, o2, o3) {
		var outlet1 = chart.series[0];
		outlet1.addPoint(o1, true);

		var outlet2 = chart.series[1];
		outlet2.addPoint(o1, true);

		var outlet3 = chart.series[2];
		outlet3.addPoint(o1, true);
		
	};
	
	$scope.fetchInitialUsageData = function() {
		$scope.usageEndTime = Date.today().setTimeToNow();
		$scope.totalCost = 0;
		$scope.currentDemand = {};
		$scope.createGraph([]);
		var one = $http.get('data/outlet1.json');
		var two = $http.get('data/outlet2.json');
		var three = $http.get('data/outlet3.json');
		var costBreakup = $http.get('https://rppapi-dot-api-dot-lh-myaccount-dev.appspot.com/api/v1/public/touSchedules');
		var holiDay = $http.get('https://rppapi-dot-api-dot-lh-myaccount-dev.appspot.com/api/v1/cms/lhHolidays?year=2017');
		
		$q.all([one, two, three,costBreakup,holiDay]).then(function (res) {
			$scope.outlet1 = res[0].data;
			$scope.outlet2 = res[1].data;
			$scope.outlet3 = res[2].data;
			$scope.costBreakup = res[3].data;
			$scope.holidayList = res[4].data;
			
			$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
			$scope.currentDemand.outlet1 = $scope.seriesData.outlet1[$scope.seriesData.outlet1.length - 1];
			$scope.currentDemand.outlet2 = $scope.seriesData.outlet2[$scope.seriesData.outlet2.length - 1];
			$scope.currentDemand.outlet3 = $scope.seriesData.outlet3[$scope.seriesData.outlet3.length - 1];
			
			$scope.isHoliday = $scope.findHoliday($scope.usageEndTime.clearTime().getTime());
			$scope.isWeekend = $scope.findWeekend($scope.usageEndTime.clearTime().getTime());
			console.log("isHoliday  ", $scope.isHoliday);
			console.log("isWeekend  ", $scope.isWeekend);
			var peakFilter = _.filter($scope.costBreakup, function(singleRow){ 
				if(singleRow.peak == "TOU_OP")
				{
					return singleRow;
				}
			});
			$scope.offPeakFactor = peakFilter[0].price;
			
			$scope.createGraph($scope.seriesData);
			$interval(function() {
				console.log('fetch data');
				$scope.realtimeUsageData();
			}, 1000);
		});
		
	};
	
	$scope.realtimeUsageData = function() {
		$scope.usageEndTime.addMinutes(5);
		$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
		$scope.currentDemand.outlet1 = $scope.seriesData.outlet1[$scope.seriesData.outlet1.length - 1];
		$scope.currentDemand.outlet2 = $scope.seriesData.outlet2[$scope.seriesData.outlet2.length - 1];
		$scope.currentDemand.outlet3 = $scope.seriesData.outlet3[$scope.seriesData.outlet3.length - 1];
		/*$scope.totalCost = _.reduce($scope.seriesData.costData, function(memo, num) {
			return memo + num[1]
		}, 0);*/
		//var breakUpCost = $scope.breakTotalCost($scope.seriesData.costData);
		$scope.updateGraph($scope.currentDemand.outlet1,
			$scope.currentDemand.outlet2,$scope.currentDemand.outlet3);
		//$scope.updatePulseMeter(breakUpCost,$scope.totalCost);
	}
	$scope.fetchInitialUsageData();
});
