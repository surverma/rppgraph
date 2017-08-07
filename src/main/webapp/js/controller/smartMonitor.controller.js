myapp.controller('SmartMonitorController', ['$scope','$interval', '$http','DataService', function($scope, $interval, $http,DataService) {

	$scope.container = $('#smartMonitor_container');
	$scope.redraw = function() {
		var data = $scope.dataTillNow();
		$scope.container.highcharts().destroy();
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
		var max = _.max([$scope.outlet1.length,$scope.outlet2.length,$scope.outlet3.length]);
		for (i = 0; i < max; i++) {
			var _zOutlet1 = {};
			var _zOutlet2 = {};
			var _zOutlet3 = {};
			var utime = 0;
			if($scope.outlet1[i] != undefined)
				utime = delta+$scope.outlet1[i][0] * 1000;
			else if($scope.outlet2[i] != undefined)
				utime = delta+$scope.outlet2[i][0] * 1000;
			else if($scope.outlet3[i] != undefined)
				utime = delta+$scope.outlet3[i][0] * 1000;
			
			if(utime != 0)
			{
				var costZone = $scope.getEnergyCost(utime);
				if(i>0)
				{
					var prevUtime = 0;
					if($scope.outlet1[i-1] != undefined)
						prevUtime = delta+$scope.outlet1[i-1][0] * 1000;
					else if($scope.outlet2[i-1] != undefined)
						prevUtime = delta+$scope.outlet2[i-1][0] * 1000;
					else if($scope.outlet3[i-1] != undefined)
						prevUtime = delta+$scope.outlet3[i-1][0] * 1000;
					
					if($scope.outlet1[i] != undefined){
						_zOutlet1.timeInterval =  (utime - prevUtime)/(1000*60); //minute
						_zOutlet1.cost =  outlet1[i-1].z.cost + (($scope.outlet1[i][1]/1000) * costZone.price); //cent
						_zOutlet1.increasedDemand =  (outlet1[i-1].y > ($scope.outlet1[i][1]/1000))? false:true ;
					}

					if($scope.outlet2[i] != undefined){
						_zOutlet2.timeInterval =  (utime - prevUtime)/(1000*60); //minute
						_zOutlet2.cost =  outlet2[i-1].z.cost + (($scope.outlet2[i][1]/1000) * costZone.price); //cent
						_zOutlet2.increasedDemand =  (outlet2[i-1].y > ($scope.outlet2[i][1]/1000))? false:true ;
					}

					if($scope.outlet3[i] != undefined){
						_zOutlet3.timeInterval =  (utime - prevUtime)/(1000*60); //minute
						_zOutlet3.cost =  outlet3[i-1].z.cost + (($scope.outlet3[i][1]/1000) * costZone.price); //cent
						_zOutlet3.increasedDemand =  (outlet3[i-1].y > ($scope.outlet3[i][1]/1000))? false:true ;
					}
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
					y : ($scope.outlet1[i]!= undefined)?($scope.outlet1[i][1]/1000):0,
					z : _zOutlet1
				}); //kwh

				outlet2.push({
					x : utime,
					y : ($scope.outlet2[i]!= undefined)?($scope.outlet2[i][1]/1000):0, 
					z : _zOutlet2
				});//kwh

				outlet3.push({
					x : utime,
					y : ($scope.outlet3[i]!= undefined)?($scope.outlet3[i][1]/1000):0, 
					z : _zOutlet3
				}); //kwh
			}
		}
		return {
			outlet1 : outlet1,
			outlet2 : outlet2,
			outlet3 : outlet3
		};
	};
	
	$scope.createGraph = function(energyData) {
		var chartOption = new SmartMonitorGraphOption();
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
	
	$scope.updateGraph = function(o1, o2, o3) {
		var outlet1 = $scope.chart.series[0];
		outlet1.addPoint(o1, true);

		var outlet2 = $scope.chart.series[1];
		outlet2.addPoint(o1, true);

		var outlet3 = $scope.chart.series[2];
		outlet3.addPoint(o1, true);
		
	};
	
	$scope.fetchInitialUsageData = function() {
		$scope.totalCost = 0;
		$scope.currentDemand = {};
		$scope.createGraph([]);
		
		DataService.getOutletData(['outlet1.json','outlet2.json','outlet3.json']).then(
				function(res) {
					$scope.outlet1 = res[0];
					$scope.outlet2 = res[1];
					$scope.outlet3 = res[2];
					
					$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
					$scope.currentDemand.outlet1 = $scope.seriesData.outlet1[$scope.seriesData.outlet1.length - 1];
					$scope.currentDemand.outlet2 = $scope.seriesData.outlet2[$scope.seriesData.outlet2.length - 1];
					$scope.currentDemand.outlet3 = $scope.seriesData.outlet3[$scope.seriesData.outlet3.length - 1];
					
					$scope.createGraph($scope.seriesData);
					$interval(function() {
						console.log('fetch data');
						$scope.realtimeUsageData();
					}, 1000);
				},
				function(error) {

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
}]);
