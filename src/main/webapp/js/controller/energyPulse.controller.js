myapp.controller('EnergyPulseController',['$scope','$rootScope','$interval', '$http', '$timeout', 'DataService', function($scope, $rootScope, $interval, $http, $timeout, DataService) {

	$scope.object = null;
	$scope.energyData = null;
	$scope.container = $('#container');
	$scope.totalCost = 0;
	$scope.lastRefreshData = null;
	$scope.refreshRate = 120;
	$scope.interval = 120;
	$scope.clientToken = '021bbbb7-4a8b-4564-bafd-cda58fa57504';
	var token = $scope.clientToken;
	$scope.apiFailure = [];
	$scope.criticalZone = false;
	$scope.cppTime = false;
	$scope.criticalStartTime = {value: "15:00", hours: 15, minutes: 0, seconds: 0};
	$scope.criticalStartTime.timeStamp = Date.today().addHours($scope.criticalStartTime.hours).getTime();
	$scope.cppDuration = 1;
	$scope.mySeries = "option1";
	var areaColor = ["rgb(135, 181, 76)","rgb(246, 208, 35)","rgb(196, 84, 75)","rgb(221, 183, 10)","rgb(135, 180, 81)"];
	$scope.online = true;
	
	
	$scope.redraw = function() {
		$scope.seriesData = null;
		var data = $scope.dataTillNow(Date.now());
		$scope.container.highcharts().destroy();
		$scope.createGraph(data.energyData,data.costData,data.cumCostData,data.breakedUpCost);
		$scope.setPieText();
	};
	
	$scope.getZoneColor = function(time){
		if(time <= Date.today().addHours(7))
			return areaColor[0];
		if(time > Date.today().addHours(7) && time <= Date.today().addHours(11))
			return areaColor[1];
		if(time > Date.today().addHours(11) && time <= Date.today().addHours(17))
			return areaColor[2];
		if(time > Date.today().addHours(17) && time <= Date.today().addHours(19))
			return areaColor[3];
		if(time > Date.today().addHours(19) && time <= Date.today().addHours(24))
			return areaColor[4];
	}
	
	$scope.addCriticalPeakToTOUSchedule = function(){
		$scope.chartTOUSchedules[0] = _.without($scope.chartTOUSchedules[0], _.findWhere($scope.chartTOUSchedules[0], {
			peak: "TOU_CP"
			}));
		var criticalTOUSchedule = {};
		criticalTOUSchedule.peak = "TOU_CP";
		if($scope.cppTime){
			criticalTOUSchedule.effDate = Date.today().getTime();
			criticalTOUSchedule.endDate = Date.today().getTime();
			criticalTOUSchedule.effHour = $scope.criticalStartTime.value;

			var res = $scope.criticalStartTime.value.split(":");
			var criticalEndHour = (parseInt(res[0])+parseInt($scope.cppDuration)) + ":" + res[1];
			criticalTOUSchedule.endHour = criticalEndHour;
		}
		criticalTOUSchedule.price = 49.8;
		criticalTOUSchedule.season = "Summer";
		$scope.chartTOUSchedules[0].push(criticalTOUSchedule);
	}
	
	$scope.breakTotalCost = function(costData)
	{
		var off_peak = null;
		var on_peak = null;
		var mid_peak = null;

		$.each(costData, function( index, value ) {
			var costZone = $scope.getEnergyCost(value[0]);
			if(costZone == "off")
			{
				off_peak += value[1];
			}
			else if(costZone == "mid")
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

	$scope.peakFactorCalculator = function(costZone)
	{
		if($scope.isWeekend || $scope.isHoliday || costZone.peak == "TOU_OP")
			costZone.peakFactor = 1;
		else if(costZone.peak == "TOU_MP")
			costZone.peakFactor = 2;
		else if(costZone.peak == "TOU_CE")
			costZone.peakFactor = 10;
		else
			costZone.peakFactor = 3;
	}
	
	$scope.energyDownloadOption = {
			fileName : 'energydata.csv',
			mode : 'csv',
			header : true,
			columns : [ {
				name : 'startDate',
				label : 'Time'
			}, {
				name : 'delivered',
				label : 'Usage(kWh)'
			}, {
				name : 'price',
				label : 'Cost(cent)'
			} ]
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
					$scope.peakFactorCalculator(singleRow);
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
					$scope.peakFactorCalculator(singleRow);
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
							$scope.peakFactorCalculator(singleRow);
							return singleRow;
						}
					}
					else
					{
						if((inputHour >= splitedEffHour &&  inputHour <= 23) ||  (inputHour >= 0 &&  inputHour <= splitedEndHour))
						{
							$scope.peakFactorCalculator(singleRow);
							return singleRow;
						}
					}
				}

			});
			finalZone = Object.create(costZone[0]);
			if($scope.criticalZone && $scope.cppTime){
				if(time >= $scope.criticalStartTime.timeStamp && time <= ($scope.criticalStartTime.timeStamp + $scope.cppDuration*60*60*1000))	
				{
					finalZone.peak = "TOU_CE";
				}
			}
			$scope.peakFactorCalculator(finalZone);
		}

		return finalZone;
	};



	$scope.dataTillNow = function(_nowsec) {
		var _today = Date.today().getTime();
		var _cumCost = $scope.seriesData?($scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length-1].y):0;
		var _intervalCost = 0;

		/*var _datadate = Date.today().clearTime().set({
			year : 2017,
			month : 6,
			day : 12
		}).getTime();*/
		//var delta = _today - _datadate + 4*3600*1000;
		var energyData = [], costData = [], cumCostData = [], breakedUpCost = {}, i = 0;
		breakedUpCost.offPeak = 0;
		breakedUpCost.midPeak = 0;
		breakedUpCost.onPeak = 0;
		breakedUpCost.criticalEvent = 0;

		for (i = 0; i < $scope.energyData.length; i++) {
			var _zObject = {};
			_zObject.offPeakFactor = $scope.offPeakFactor;
			//var utime = $scope.energyData[i].endDate; //millisecond
			var utime = $scope.energyData[i].endDate + ($scope.timeGap*1000); //wrong data temporary fix
			/*if(!$scope.loadFull && utime > _nowsec){
				break;
			}*/
			var costZone = $scope.getEnergyCost(utime);
			_zObject.peakFactor = costZone.peakFactor;
			_zObject.price = costZone.price;
			if($scope.lastRefreshData != null)
			{
			//	var prevUtime = $scope.lastRefreshData.endDate; //millisecond 
				var prevUtime = $scope.lastRefreshData.endDate  + ($scope.timeGap*1000); //wrong data temporary fix
				_zObject.timeInterval =  (utime - prevUtime)/(1000*60); //minute
			}
			else
			{
				_zObject.timeInterval = 0;
			}

			_intervalCost = $scope.energyData[i].price * 100 //$ * 100
			_cumCost += _intervalCost; 

			if(costZone.peak == "TOU_OP")
				breakedUpCost.offPeak += _intervalCost/100;
			else if(costZone.peak == "TOU_MP")
				breakedUpCost.midPeak += _intervalCost/100;
			else if(costZone.peak == "TOU_CE")
				breakedUpCost.criticalEvent += _intervalCost/100;
			else
				breakedUpCost.onPeak += _intervalCost/100;

			energyData.push({
				x : utime, //millisec
				y : ($scope.energyData[i].delivered * 1000), //kwh * 1000
				z : _zObject
			}); 

			costData.push({
				x : utime, //millisec
				y : ($scope.energyData[i].price * 100 * costZone.peakFactor), //cent * 100 * peak
				z : _zObject
			});

			cumCostData.push({
				x : utime, //millisec
				y : _cumCost,//cent * 100
				z : _zObject
			}); 
			$scope.lastRefreshData = $scope.energyData[i];
		}
		return {
			energyData : energyData,
			costData : costData,
			cumCostData : cumCostData,
			breakedUpCost : breakedUpCost
		};
	};

	$scope.createGraph = function(edata, pdata, cdata, pieData) {
		var chartOption = new EnergyPulseGraphOption();
		//chartOption.subtitle.text = Date.today().toLongDateString() + "<br>Today's Energy Cost : <b>¢" + $scope.totalCost.toFixed(2) + "</b>";
		chartOption.subtitle.text = Highcharts.dateFormat('%A, %B %d, %Y', Date.today()) + "<br>Today's Energy Cost : <b>" + $scope.formatCost($scope.totalCost) + "</b>";
		var legendColor = ["rgb(0, 102, 153)","rgb(102, 102, 51)","rgb(160, 84, 3)"];
		//var areaColor = ["rgb(135, 181, 76)","rgb(246, 208, 35)","rgb(196, 84, 75)","rgb(221, 183, 10)","rgb(135, 180, 81)"];
		var gradientSpace = {
				x1 : 1,
				y1 : 0,
				x2 : 1,
				y2 : 1
		};

		var _zonesWithColorGrad = [ {
			value : Date.today().addHours(7),
			color : {
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
			color : $scope.getZoneColor(Date.today().addHours(7))
		}, {
			value : Date.today().addHours(11),
			color : $scope.getZoneColor(Date.today().addHours(11))
		}, {
			value : Date.today().addHours(17),
			color : $scope.getZoneColor(Date.today().addHours(17))
		}, {
			value : Date.today().addHours(19),
			color : $scope.getZoneColor(Date.today().addHours(19))
		}, {
			value : Date.today().addHours(24),
			color : $scope.getZoneColor(Date.today().addHours(24))
		} ];
		
		if($scope.cppTime)
		{
			var _plotBand = [{
				color: '#ffe0b3', // Color value
				from: Date.today().addHours(parseInt($scope.criticalStartTime.hours)).addMinutes($scope.criticalStartTime.minutes).getTime(), // Start of the plot band
				to: Date.today().addHours(parseInt($scope.criticalStartTime.hours)+parseInt($scope.cppDuration)).addMinutes($scope.criticalStartTime.minutes).getTime(),
				label: { 
					text: '<b>Critical</b><br> <b>Event</b>', // Content of the label. 
					align: 'center' // Positioning of the label. 
				}// End of the plot band
			}];
			console.log("Plot Band", _plotBand);
			var cppZone = 
				[{
					value : Date.today().addHours($scope.criticalStartTime.hours).addMinutes($scope.criticalStartTime.minutes),
					color : $scope.getZoneColor(Date.today().addHours($scope.criticalStartTime.hours).addMinutes($scope.criticalStartTime.minutes))
				},
				{
					value : Date.today().addHours(parseInt($scope.criticalStartTime.hours)+parseInt($scope.cppDuration)).addMinutes($scope.criticalStartTime.minutes),
					color : 'orange'
				}];
			
			_zonesWithSolidColor = _.reject(_zonesWithSolidColor, function(o){ return (o.value >= cppZone[0].value) && (o.value <= cppZone[1].value) });
			_zonesWithSolidColor = _.union(_zonesWithSolidColor, cppZone);
			_zonesWithSolidColor = _.sortBy(_zonesWithSolidColor, function(o) { return o.value; });
			console.log("zone", _zonesWithSolidColor);
		}
		
		

		var _zonesWithClass = [ {
			value : Date.today().addHours(7),
			className: 'zone-off-energy'
		}, {
			value : Date.today().addHours(11),
			className: 'zone-mid-energy'
		}, {
			value : Date.today().addHours(17),
			className: 'zone-on-energy'
		}, {
			value : Date.today().addHours(19),
			className: 'zone-mid-energy'
		}, {
			value : Date.today().addHours(24),
			className: 'zone-off-energy'
		} ];


		var _series = [];
		_series.push({
			name : 'Energy',
			lineWidth: 1,
			color : legendColor[0],
			data : edata,
			zoneAxis : 'x',
			zones : (($scope.isHoliday || $scope.isWeekend)? null:_zonesWithSolidColor),
			fillColor : (($scope.isHoliday || $scope.isWeekend)? areaColor[0]:null),
			fillOpacity: 0.7
		});
		
		if($scope.mySeries == "option2")
			_series.push({
				name : 'Cost',
				lineWidth: 1,
				color : legendColor[1],
				data : pdata,
				yAxis : 0,
				zoneAxis : 'x',
				zones : (($scope.isHoliday || $scope.isWeekend)? null:_zonesWithSolidColor),
				fillColor : (($scope.isHoliday || $scope.isWeekend)? areaColor[0]:null),
				fillOpacity: 0.5
			});

		_series.push({
			name : 'Cumulative cost',
			data : cdata,
			type : 'line',
			yAxis : 1,
			color : legendColor[2],
			lineWidth : 1
		});

		_series.push({
			type: 'pie',
			name: 'Total cost',
			plotOptions: {
				series: {
					tooltip: {
						backgroundColor: 'black',
						borderWidth: 0,
						shadow: false,
						useHTML: true,
						padding: 0,
						pointFormat: '<span class="f32"><span class="flag {point.flag}">' +
						'</span></span> {point.name}<br>' +
						'<span style="font-size:30px">{point.value}/km²</span>',
						positioner: function () {
							return { x: 0, y: 250 };
						},
						formatter : function() {
							var x= 1 ;
						}
					}
				}
			},
			data: createPieChartdata(pieData),
			innerSize: '60%',
			center: [30, -30],
			size: 100,
			showInLegend: false,
			dataLabels: {
				enabled: false
			}
		});

		chartOption.series = _series;
		if($scope.criticalZone && $scope.cppTime)
			chartOption.xAxis.plotBands = _plotBand;
		$scope.chart = new Highcharts.chart(chartOption);

	};

	/*$scope.createPieGraph = function(breakUpCost,totalCost) {
		var chartOption = new EnergyPulseMonitorOption();
		var _series = [
			{
		        name: 'Critical',
		        data: [{
		            color: Highcharts.getOptions().colors[5],
		            radius: '112%',
		            innerRadius: '88%',
		            y: 70
		        }]
		    }, 
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
			,

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
		    }];
		chartOption.series = _series;
		console.log("Pie chart options",chartOption);
		pie_chart = new Highcharts.chart(chartOption);

	};*/

	$scope.updateGraph = function(edatas, pdatas, cdatas, pieDatas) {
		var series = _.filter($scope.chart.series, function(s){ return s.name == "Energy" });
		var eseries = series[0];
		$.each(edatas, function(index, edata) {
			eseries.addPoint(edata, true);
		});

		if($scope.mySeries == "option2"){
			series = _.filter($scope.chart.series, function(s){ return s.name == "Cost" });
			var pseries = series[0];
			$.each(pdatas, function(index, pdata) {
				pseries.addPoint(pdata, true);
			});
		}

		series = _.filter($scope.chart.series, function(s){ return s.name == "Cumulative cost" });
		var cseries = series[0];
		$.each(cdatas, function(index, cdata) {
			cseries.addPoint(cdata, true);
		});

		series = _.filter($scope.chart.series, function(s){ return s.name == "Total cost" });
		var pieseries = series[0];
		$.each(pieDatas, function(index, pieData) {
			pieseries.setData(createPieChartdata(pieData));
		});

	};
	/*$scope.updatePulseMeter= function(breakUpCost,totalCost) {
		if(pie_chart)
		{
			pie_chart.series[0].points[0].update((breakUpCost.onCost + breakUpCost.midCost + breakUpCost.offCost)*100/totalCost);
			pie_chart.series[1].points[0].update((breakUpCost.midCost + breakUpCost.offCost)*100/totalCost);
			pie_chart.series[2].points[0].update(breakUpCost.offCost*100/totalCost);
		}
		console.log("Updating pulse graph",pie_chart);
	};*/
	$scope.fetchInitialUsageData = function() {
		$scope.stopAllIntervals();
		//$scope.usageEndTime= Date.now();
		$scope.totalCost = 0;
		$scope.createGraph([], [], [], []);
		$scope.seriesData = null;
		$scope.nowTime = Math.floor(Date.now()/1000);
		$scope.queryString = "start="+ $scope.startTime + "&end=" + $scope.nowTime + "&interval=" + $scope.interval;
		DataService.getEnergyData($scope.startTime,$scope.nowTime,$scope.interval,$scope.clientToken).then(
				function(res) {
					$scope.online = true;
					$rootScope.$broadcast('timer-start');
					$scope.energyData = res;
					$scope.timeGap = $scope.startTime - ($scope.energyData[0].startDate/1000);
					$scope.message = "Latest data not available. Manipulating data to plot graph";
					$scope.seriesData = $scope.dataTillNow($scope.nowTime);
					$scope.totalCost = $scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length-1].y/100; // divided by 100 (unit - cent)
					$scope.createGraph($scope.seriesData.energyData, $scope.seriesData.costData, $scope.seriesData.cumCostData,$scope.seriesData.breakedUpCost);
					$scope.setPieText();
					if($scope.online)
					{
						intervals.push($interval(function() {
							console.log('fetch data');
							$scope.realtimeUsageData();
						}, $scope.refreshRate*1000));
					}
					$scope.lastOnlineTime = $scope.nowTime;
				},
				function(error) {
					$scope.online = false;
					$scope.lastOnlineTime = $scope.startTime;
					var failure = {};
					failure.time = $scope.nowTime;
					failure.status = error;
					$scope.apiFailure.push(failure);
					$timeout($scope.fetchInitialUsageData, $scope.refreshRate*1000);
				});

		//$scope.createPieGraph(breakUpCost,$scope.totalCost);

	}

	$scope.setPieText = function()
	{
		var pie = _.filter($scope.chart.series, function(s){ return s.name == "Total cost" });
		var position = null,
		plotLine,
		newx,
		d,
		xAxis = $scope.chart.xAxis[0],
		rend = $scope.chart.renderer,
		left = $scope.chart.plotLeft + pie[0].center[0],
		top = $scope.chart.plotTop + pie[0].center[1],
		totalCost = pie[0].yData[0] + pie[0].yData[1] + pie[0].yData[2];
		$scope.pieText = rend.text("<b>" + $scope.formatCost($scope.totalCost) + "</b>", left,  top).attr({ 'text-anchor': 'middle'}).add();
	}

	$scope.realtimeUsageData = function() {
		$scope.usageEndTime = Date.today().setTimeToNow();
		$scope.nowTime = Math.floor(Date.now()/1000);
		$rootScope.$broadcast('timer-stop');
		$scope.queryString = "start="+ $scope.lastOnlineTime + "&end=" + $scope.nowTime + "&interval=" + $scope.interval;
		DataService.getEnergyData($scope.lastOnlineTime,$scope.nowTime,$scope.interval,$scope.clientToken).then(
				function(res) {
					$scope.online = true;
					$scope.timeGap = $scope.lastOnlineTime - (res[0].startDate/1000);
					$rootScope.$broadcast('timer-start');
					$scope.energyData = res;
					//$scope.energyData = _.union($scope.energyData, res);
					$scope.seriesData = $scope.dataTillNow($scope.nowTime);
					/*$scope.totalCost = _.reduce($scope.seriesData.costData, function(memo, num) {
						return memo + num[1]
					}, 0);*/
					//var breakUpCost = $scope.breakTotalCost($scope.seriesData.costData);
					$scope.updateGraph($scope.seriesData.energyData,
							$scope.seriesData.costData,
							$scope.seriesData.cumCostData,
							$scope.seriesData.breakedUpCost);
					$scope.totalCost = $scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length-1].y/100; // unit - cent
					$scope.chart.setTitle(null, { text: Highcharts.dateFormat('%A, %B %d, %Y', Date.today()) + 
						"<br>Today's Energy Cost : <b>" + $scope.formatCost($scope.totalCost) + "</b>" }); 
					$scope.pieText.textSetter("<b>" + $scope.formatCost($scope.totalCost) + "</b>");
					$scope.lastOnlineTime = $scope.nowTime;
				},
				function(error) {
					$rootScope.$broadcast('timer-start');
					$scope.online = false;
					var failure = {};
					failure.time = $scope.nowTime;
					failure.status = error;
					$scope.apiFailure.push(failure);
				});

		//$scope.updatePulseMeter(breakUpCost,$scope.totalCost);
	}
	$rootScope.$on('timer-start', function (event, data) {
		$scope.counter = $scope.refreshRate;
		timerInterval = ($interval(function() {
			$scope.counter--;
		}, 1000));
		intervals.push(timerInterval);
	});

	$rootScope.$on('timer-stop', function (event, data) {
		$interval.cancel(timerInterval);
		$scope.counter = $scope.refreshRate;
	});

	$scope.toggleToken = function(){
		if($scope.clientToken == "XYZ")
			$scope.clientToken = token;
		else
			$scope.clientToken = "XYZ";
	}
	
	
	$scope.init = function(){
		$scope.timeGap = 0;
		$scope.online = true;
		if($scope.criticalZone)
			$scope.addCriticalPeakToTOUSchedule();
		$scope.fetchInitialUsageData();
	}
	
	$scope.changeCppTime = function(){
		$scope.criticalStartTime.value = ($scope.criticalStartTime.hours.length<2)?("0"+$scope.criticalStartTime.hours) + ":" + "00":($scope.criticalStartTime.hours) + ":" + "00";
		$scope.criticalStartTime.timeStamp = Date.today().addHours($scope.criticalStartTime.hours).getTime();
		console.log("CPP", $scope.criticalStartTime);
	}
	
	$scope.init();
	
	$(document).on('click', '.number-spinner button', function () {    
		var oldValue = $scope.criticalStartTime.hours,
		newVal = 0,
		btn = $(this);
		
		
		if (btn.attr('data-dir') == 'up') {
			newVal = ((parseInt(oldValue)+1)%24);
		} else {
			if (oldValue > 0) {
				newVal = parseInt(oldValue) - 1;
			} else {
				newVal = 0;
			}
		}
		$scope.criticalStartTime.hours = newVal;
		$scope.criticalStartTime.value = ($scope.criticalStartTime.hours<10)?("0"+$scope.criticalStartTime.hours) + ":" + "00":($scope.criticalStartTime.hours) + ":" + "00";
		$scope.criticalStartTime.timeStamp = Date.today().addHours($scope.criticalStartTime.hours).getTime();
		console.log("CPP", $scope.criticalStartTime);
	});
}]);
