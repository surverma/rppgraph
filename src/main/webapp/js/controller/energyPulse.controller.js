myapp.controller('EnergyPulseController',['$scope','$rootScope','$interval', '$http', '$timeout','$cookies', 'DataService', function($scope, $rootScope, $interval, $http, $timeout,$cookies, DataService) {

	$scope.object = null;
	$scope.energyData = null;
	$scope.container = $('#container');
	$scope.totalCost = 0;
	$scope.lastRefreshData = null;
	$scope.refreshRate = 120;
	$scope.interval = 120;
	$scope.clientToken = 'f30bde0b-f0d5-4f4b-ba2f-7fb56b1dccce';
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
	$scope.cppDropdown = [
		{name : "7 AM", value : "07"},{name : "8 AM", value : "08"},{name : "9 AM", value : "09"},
		{name : "10 AM", value : "10"},{name : "11 AM", value : "11"},{name : "12 PM", value : "12"},{name : "1 PM", value : "13"},{name : "2 PM", value : "14"},
	    {name : "3 PM", value : "15"},{name : "4 PM", value : "16"},{name : "5 PM", value : "17"},{name : "6 PM", value : "18"},{name : "7 PM", value : "19"},
	    {name : "8 PM", value : "20"},{name : "9 PM", value : "21"},{name : "10 PM", value : "22"}
	];
	
	$scope.redraw = function() {
		$scope.seriesData = null;
		var data = $scope.dataTillNow(Date.now());
		$scope.container.highcharts().destroy();
		$scope.createGraph(data.energyData,data.costData,data.cumCostData,data.breakedUpCost);
		//$scope.setPieText();
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
		var breakedUpCost = {};
		breakedUpCost.offPeak = {};
		breakedUpCost.midPeak = {};
		breakedUpCost.onPeak = {};
		breakedUpCost.criticalEvent = {};
		breakedUpCost.offPeak.cost = 0;
		breakedUpCost.midPeak.cost = 0;
		breakedUpCost.onPeak.cost = 0;
		breakedUpCost.criticalEvent.cost = 0;
		breakedUpCost.offPeak.energy = 0;
		breakedUpCost.midPeak.energy = 0;
		breakedUpCost.onPeak.energy = 0;
		breakedUpCost.criticalEvent.energy = 0;
		if($scope.seriesData){
			breakedUpCost = $scope.seriesData.breakedUpCost;
		}
		var _intervalCost = 0;
		
		var energyData = [], costData = [], cumCostData = [], i = 0;

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
			$scope.totalEnergy +=  $scope.energyData[i].delivered * 1000;

			if(costZone.peak == "TOU_OP"){
				breakedUpCost.offPeak.cost += _intervalCost/100;
				breakedUpCost.offPeak.energy += $scope.energyData[i].delivered * 1000;
			}
			else if(costZone.peak == "TOU_MP"){
				breakedUpCost.midPeak.cost += _intervalCost/100;
				breakedUpCost.midPeak.energy += $scope.energyData[i].delivered * 1000;
			}
			else if(costZone.peak == "TOU_CE"){
				breakedUpCost.criticalEvent.cost += _intervalCost/100;
				breakedUpCost.criticalEvent.energy += $scope.energyData[i].delivered * 1000;
			}
			else{
				breakedUpCost.onPeak.cost += _intervalCost/100;
				breakedUpCost.onPeak.energy += $scope.energyData[i].delivered * 1000;
			}

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
		var donutOption = new EnergyPieOption();
		donutOption.series[0].data=createPieChartdata(pieData,$scope.totalEnergy);
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
			name : 'Total cost',
			data : cdata,
			type : 'line',
			yAxis : 1,
			color : legendColor[2],
			lineWidth : 1
		});

		_series.push({
			type: 'pie',
			name: 'Breakdown cost',
			tooltip: {enabled: false},
			plotOptions: {
				pie:{
					allowPointSelect: true,
					borderWidth: 0,
					cursor: 'pointer',
					innerSize: 130,
					dataLabels: {enabled: false},
					events: {
						click:function(event) {
							var x = 1;			
						}
					},
					shadow: false
				}
			},
			data: createPieChartdata(pieData,$scope.totalEnergy),
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
		console.log("Pie option",donutOption);
		$scope.donutChart = new Highcharts.chart(donutOption);
		$scope.$emit('chartLoaded');

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

		series = _.filter($scope.chart.series, function(s){ return s.name == "Total cost" });
		var cseries = series[0];
		$.each(cdatas, function(index, cdata) {
			cseries.addPoint(cdata, true);
		});
		
		series = _.filter($scope.chart.series, function(s){ return s.name == "Breakdown cost" });
		var pieseries = series[0];
		pieseries.setData(createPieChartdata(pieDatas,$scope.totalEnergy));
		
		var pieseries = $scope.donutChart.series[0];
		pieseries.setData(createPieChartdata(pieDatas,$scope.totalEnergy));

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
		$scope.createGraph([], [], [], {});
		$scope.seriesData = null;
		$scope.nowTime = Math.floor(Date.now()/1000);
		$scope.queryString = "start="+ $scope.startTime + "&end=" + $scope.nowTime + "&interval=" + $scope.interval;
		DataService.getEnergyData($scope.startTime,$scope.nowTime,$scope.interval).then(
				function(res) {
					$scope.online = true;
					$rootScope.$broadcast('timer-start');
					$scope.energyData = res;
					$scope.totalEnergyData = res;
					$scope.timeGap = $scope.startTime - ($scope.energyData[0].startDate/1000);
					$scope.message = "Latest data not available. Manipulating data to plot graph";
					$scope.seriesData = $scope.dataTillNow($scope.nowTime);
					$scope.totalCost = $scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length-1].y/100; // divided by 100 (unit - cent)
					$scope.createGraph($scope.seriesData.energyData, $scope.seriesData.costData, $scope.seriesData.cumCostData,$scope.seriesData.breakedUpCost);
					$scope.setDonutText();
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
		$scope.$emit('chartLoaded');
	}

	$scope.setDonutText = function()
	{
		//var pie = _.filter($scope.chart.series, function(s){ return s.name == "Total cost" });
		var pie = $scope.donutChart.series[0];
		var position = null,
		plotLine,
		newx,
		d,
		xAxis = $scope.donutChart.xAxis[0],
		rend = $scope.donutChart.renderer,
		left = $scope.donutChart.plotLeft + pie.center[0],
		top = $scope.donutChart.plotTop + pie.center[1],
		totalCost = pie.yData[0] + pie.yData[1] + pie.yData[2];
		$scope.donutText = rend.text("<b>" + $scope.formatCost($scope.totalCost) + "</b>", left,  top).attr({ 'text-anchor': 'middle'}).add();
	}
	
	$scope.setPieText = function()
	{
		var pie = _.filter($scope.chart.series, function(s){ return s.name == "Breakdown cost" });
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
		DataService.getEnergyData($scope.lastOnlineTime,$scope.nowTime,$scope.interval).then(
				function(res) {
					$scope.online = true;
					$scope.timeGap = $scope.lastOnlineTime - (res[0].startDate/1000);
					$rootScope.$broadcast('timer-start');
					$scope.energyData = res;
					$scope.totalEnergyData = _.union($scope.totalEnergyData, res);
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
					$scope.donutText.textSetter("<b>" + $scope.formatCost($scope.totalCost) + "</b>");
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
		if($scope.clientToken == "XYZ"){
			$scope.clientToken = token;
			$cookies.put('RPP_KEY',$scope.clientToken);
		}
		else
		{
			$scope.clientToken = "XYZ";
			$cookies.put('RPP_KEY',$scope.clientToken);
		}
	}
	
	
	$scope.init = function(){
		$scope.mockSetCookie();
		$scope.timeGap = 0;
		$scope.totalEnergy = 0;
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
	$scope.mockSetCookie = function() {
		console.log("Set cookie..."+$scope.clientToken);
		$cookies.put('RPP_KEY',$scope.clientToken);
	}
	$scope.mockUpdateToken = function() {		
		$scope.mockSetCookie();	
		$scope.fetchInitialUsageData();
	}
	$scope.init();
	
	/*$(document).on('click', '.number-spinner button', function () {    
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
	});*/
}]);
