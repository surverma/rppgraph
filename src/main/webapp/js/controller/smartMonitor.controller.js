myapp.controller('SmartMonitorController', ['$scope','$interval', '$http','DataService', function($scope, $interval, $http,DataService) {

	$scope.container = $('#smartMonitor_container');
	$scope.deviceCount = "3";
	$scope.loadFull = true;
    $scope.online = true;
    $scope.stacked = false;
    var areaColor = ["rgba(135, 181, 76,0.5)","rgba(246, 208, 35,0.5)","rgba(196, 84, 75,0.5)","rgba(221, 183, 10,0.5)","rgba(135, 180, 81,0.5)"];
    $scope.criticalZone = false;
	$scope.cppTime = false;
	$scope.criticalStartTime = {value: "15:00", hours: 15, minutes: 0, seconds: 0};
	$scope.criticalStartTime.timeStamp = Date.today().addHours($scope.criticalStartTime.hours).getTime();
	$scope.cppDuration = 1;
	$scope.cppDropdown = [
		{name : "7 AM", value : "07"},{name : "8 AM", value : "08"},{name : "9 AM", value : "09"},
		{name : "10 AM", value : "10"},{name : "11 AM", value : "11"},{name : "12 PM", value : "12"},{name : "1 PM", value : "13"},{name : "2 PM", value : "14"},
	    {name : "3 PM", value : "15"},{name : "4 PM", value : "16"},{name : "5 PM", value : "17"},{name : "6 PM", value : "18"},{name : "7 PM", value : "19"},
	    {name : "8 PM", value : "20"},{name : "9 PM", value : "21"},{name : "10 PM", value : "22"}
	];
	
	/*$scope.redraw = function(stacked) {
		$scope.container.highcharts().destroy();
		angular.forEach($scope.outlet, function(_outlet, key) {
			_outlet.series = null;
			_outlet.zOutlet = null;
		});
		
		
		$scope.dataTillNow(stacked,Date.now());
		$scope.calculateCurrentDemand();
		$scope.createGraph();
	};*/
	
	$scope.dataTillNow = function(stacked,_nowsec) {
		var _today = Date.today().getTime();
		var _datadate = Date.today().clearTime().set({
			year : 2017,
			month : 6,
			day : 12
		}).getTime();

		var delta = _today - _datadate + 4*3600*1000;
		var outlet = [];
		//var max = _.max([$scope.outlet1.length,$scope.outlet2.length,$scope.outlet3.length]);
		var max =  _.max($scope.outlet, function(outlet){ return outlet.data.length; }).data.length;
		for (i = 0; i < max; i++) {
			var utime = 0;
			utime = delta+$scope.outlet[0].data[i][0] * 1000;
			if(!$scope.loadFull && utime > _nowsec){
				break;
			}
			if(utime != 0)
			{
				var costZone = $scope.getEnergyCost(utime);
				var energySum = 0;
				angular.forEach($scope.outlet, function(_outlet, key) {
					_outlet.zOutlet = {};
					if(stacked)
						energySum += _outlet.data[i][1]/1000;
					if(outlet[key] == undefined) outlet[key] = [];
					if(_outlet.series == undefined) _outlet.series = [];

					if(i>0)
					{
						var prevUtime = 0;
						var prevSeries = _outlet.series[i-1];
						prevUtime = delta+$scope.outlet[0].data[i-1][0] * 1000;
						_outlet.zOutlet.timeInterval =  (utime - prevUtime)/(1000*60); //minute
						_outlet.zOutlet.cost =  prevSeries.z.cost + ((_outlet.data[i][1]/1000) * costZone.price); //cent
						_outlet.zOutlet.increasedDemand =  ((prevSeries.y-prevSeries.z.increasedDemand) > (_outlet.data[i][1]/1000))? false:true ;
						_outlet.zOutlet.yIncreased =  (stacked)?(energySum - _outlet.data[i][1]/1000):0;
					}
					else
					{
						_outlet.zOutlet.timeInterval =  0; //minute
						_outlet.zOutlet.cost =  0; //cent
						_outlet.zOutlet.increasedDemand =  false;
						_outlet.zOutlet.yIncreased = 0;
					}
					_outlet.series.push({
						x : utime,
						y : (stacked)? energySum : (_outlet.data[i][1]/1000),
						z : _outlet.zOutlet
					});
				});
			}
		}
	};
	
	$scope.createGraph = function() {
		var chartOption = new SmartMonitorGraphOption();
		//chartOption.subtitle.text = Date.today().toLongDateString() + "<br>Today's Energy Cost : <b>¢" + $scope.totalCost.toFixed(2) + "</b>";
		chartOption.subtitle.text = Highcharts.dateFormat('%A, %B %d,%Y', Date.today()) ;
		
		var fillColor = ["rgba(255, 51, 51, 0.7)","rgba(230, 184, 0, 0.7)","rgba(153, 153, 255, 0.7)","rgba(153, 102, 51,0.7)",
			"rgba(0, 102, 204,0.7)","rgba(204, 102, 153,0.7)"];
		var color = ["rgb(255, 51, 51)","rgb(230, 184, 0)","rgb(153, 153, 255)","rgb(153, 102, 51)","rgb(0, 102, 204)",
			"rgb(204, 102, 153)"];
		
		var _plotBand = [{
			color: areaColor[0], // Color value
			from: Date.today().addHours(0).getTime(), // Start of the plot band
			to: Date.today().addHours(7).getTime(),
		},
		{
			color: areaColor[1], // Color value
			from: Date.today().addHours(7).getTime(), // Start of the plot band
			to: Date.today().addHours(11).getTime(),
		},
		{
			color: areaColor[2], // Color value
			from: Date.today().addHours(11).getTime(), // Start of the plot band
			to: Date.today().addHours(17).getTime()
		},
		{
			color: areaColor[3], // Color value
			from: Date.today().addHours(17).getTime(), // Start of the plot band
			to: Date.today().addHours(19).getTime()
		},
		{
			color: areaColor[4], // Color value
			from: Date.today().addHours(19).getTime(), // Start of the plot band
			to: Date.today().addHours(24).getTime()
		}];
		
		if($scope.cppTime)
		{
			var _criticalBand = {
				color: '#ffe0b3', // Color value
				from: Date.today().addHours(parseInt($scope.criticalStartTime.hours)).addMinutes($scope.criticalStartTime.minutes).getTime(), // Start of the plot band
				to: Date.today().addHours(parseInt($scope.criticalStartTime.hours)+parseInt($scope.cppDuration)).addMinutes($scope.criticalStartTime.minutes).getTime(),
				label: { 
					text: '<b>Critical</b><br> <b>Event</b>', // Content of the label. 
					align: 'center' // Positioning of the label. 
				}// End of the plot band
			};
			_plotBand.push(_criticalBand);
			console.log("Plot Band", _plotBand);
		}
		
		var _series = [];
		
		for(i=($scope.outlet.length-1);i>=0;i--)
		{
			_series.push({
				name : $scope.outlet[i].name,
				data : $scope.outlet[i].series,
				fillColor : fillColor[i],
				color : color[i]
			});
		}
		chartOption.series = _series;
		chartOption.xAxis.plotBands = _plotBand;
		$scope.chart = new Highcharts.chart(chartOption);

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
	
	$scope.calculateCurrentDemand = function()
	{
		angular.forEach($scope.outlet, function(outletData, key) {
			var currentSeriesData = outletData.series[outletData.series.length - 1];
			outletData.currentDemand=currentSeriesData.y - currentSeriesData.z.yIncreased;
			outletData.yesterDayCost = "65.99";
		});
	}
	
	$scope.updateGraph = function() {
		angular.forEach($scope.outlet, function(outletData, key) {
			$scope.chart.series[key].addPoint(outletData.series[outletData.series.length - 1]);
		});
	};
	
	$scope.changeCppTime = function(){
		$scope.criticalStartTime.value = ($scope.criticalStartTime.hours.length<2)?("0"+$scope.criticalStartTime.hours) + ":" + "00":($scope.criticalStartTime.hours) + ":" + "00";
		$scope.criticalStartTime.timeStamp = Date.today().addHours($scope.criticalStartTime.hours).getTime();
		console.log("CPP", $scope.criticalStartTime);
	}
	
	$scope.fetchInitialUsageData = function() {
		$scope.totalCost = 0;
		$scope.currentDemand = {};
		//	$scope.createGraph([]);
		var outletSource = [];
		$scope.outlet = [];
		for(var i = 0; i< $scope.deviceCount; i++)
			outletSource.push("outlet" + (i+1) + ".json");
		/*outletSource.push("outlet2.json");
		outletSource.push("outlet3.json");*/
		DataService.getHubStatus($scope.meterId).then(
				function(res) {
					$scope.hubList = res;
					DataService.getOutletData($scope.hubList).then(
							function(res) {
								$scope.outlet = res;
								$scope.dataTillNow($scope.stacked,$scope.usageEndTime.getTime());

								$scope.calculateCurrentDemand();
								$scope.createGraph();
								if($scope.online)
								{
									intervals.push($interval(function() {
										console.log('fetch data');
										$scope.realtimeUsageData();
									}, $scope.refreshRate*1000));
								}
							},
							function(error) {
								$scope.online = false;
							});
				},
				function(error) {
					$scope.online = false;
				});
	}
	
	$scope.realtimeUsageData = function() {
		$scope.usageEndTime = Date.today().setTimeToNow();
		$scope.dataTillNow($scope.stacked,$scope.usageEndTime.getTime());
		$scope.calculateCurrentDemand();
		/*$scope.totalCost = _.reduce($scope.seriesData.costData, function(memo, num) {
			return memo + num[1]
		}, 0);*/
		//var breakUpCost = $scope.breakTotalCost($scope.seriesData.costData);
		$scope.updateGraph();
		//$scope.updatePulseMeter(breakUpCost,$scope.totalCost);
	}
	$scope.fetchInitialUsageData();
}]);
