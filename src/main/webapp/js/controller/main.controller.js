
myapp.controller('MainCtrl',['$scope','$rootScope', '$interval', '$http','DataService','$state','deviceDetector','$interval', function($scope,$rootScope, $interval, $http,DataService,$state,deviceDetector,$interval) {
	
    $scope.vm = deviceDetector;
    $scope.loadFull = true;
    $scope.online = true;
    $scope.stacked = false;
    $scope.deviceCount = "3";
    $scope.clientToken = '84845a8a-803c-4644-b8a8-3bfb64241cff';
    $scope.criticalZone = false;
    $scope.refreshRate = 30;
    
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
	
	$scope.init = function()
	{
		$rootScope.startTime = Date.today().getTime()/1000;
		$rootScope.nowTime = Math.floor(Date.now()/1000);
		$rootScope.usageEndTime = Date.today().setTimeToNow();
		$rootScope.usageEndTime.addSeconds(10);
		$rootScope.isWeekend = $scope.findWeekend($scope.usageEndTime.clearTime().getTime());
		$scope.criticalStartTime = {value: "15:00", hours: 15, minutes: 0, seconds: 0, meridian: undefined};
		$scope.criticalStartTime.timeStamp = Date.today().addHours($scope.criticalStartTime.hours)
			.addMinutes($scope.criticalStartTime.minutes).getTime();
		console.log("isWeekend  ", $scope.isWeekend);
		
		$( document ).ready(function() {
		    $('#timepicker1').timepicker({showMeridian: false});
		    $('#timepicker1').timepicker().on('changeTime.timepicker', function(e) {
		        console.log('The time is ' + e.time.value);
		        console.log('The hour is ' + e.time.hours);
		        console.log('The minute is ' + e.time.minutes);
		        $scope.criticalStartTime = e.time;
		        $scope.criticalStartTime.timeStamp = Date.today().addHours(e.time.hours)
		        	.addMinutes(e.time.minutes).getTime();
		        $scope.reload();
		      });
		});
		
		
		DataService.getTouSchedules().then(
				function(res) {
					DataService.getHoliday().then(
							function(res) {
								$rootScope.holidayList = res;
								$rootScope.isHoliday = $scope.findHoliday($scope.usageEndTime.clearTime().getTime());
								$rootScope.usageEndTime = Date.today().setTimeToNow();
								console.log("isHoliday  ", $scope.isHoliday);
								$state.go("energy.plot");
							},
							function(error) {
								$scope.online = false;

							});
					$rootScope.costBreakup = res;
					var peakFilter = _.filter($scope.costBreakup, function(singleRow){ 
						if(singleRow.peak == "TOU_OP")
						{
							return singleRow;
						}
					});
					$rootScope.offPeakFactor = peakFilter[0].price;
				},
				function(error) {
					$scope.online = false;

				});
				
	}
	
	$scope.reload = function()
	{
		angular.forEach(intervals, function(interval) {
		    $interval.cancel(interval);
		});
		$state.reload("energy.plot");
	}
	
	$scope.formatCost = function(centValue)
	{
		if(centValue < 100 && centValue > 0)
			return "¢" + centValue.toFixed(2);
		else if(centValue >= 100)
			return "$" + (centValue/100).toFixed(2); 
	}
	
	$scope.init();
	
}]);
