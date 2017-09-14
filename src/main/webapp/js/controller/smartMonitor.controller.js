myapp.controller('SmartMonitorController', ['$scope','$interval', '$http','DataService', function($scope, $interval, $http,DataService) {

	$scope.container = $('#smartMonitor_container');
	$scope.deviceCount = "3";
	$scope.loadFull = true;
    $scope.online = true;
    $scope.stacked = false;
	
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
		
		var fillColor = ["rgba(255, 51, 51, 0.7)","rgba(230, 184, 0, 0.7)","rgba(153, 153, 255, 0.7)"];
		var color = ["rgb(255, 51, 51)","rgb(230, 184, 0)","rgb(153, 153, 255)"];
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
		
		DataService.getOutletData(outletSource).then(
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
	};
	
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
