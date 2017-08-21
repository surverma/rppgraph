
myapp.controller('MainCtrl',['$scope','$rootScope', '$interval', '$http','DataService','$state','deviceDetector', function($scope,$rootScope, $interval, $http,DataService,$state,deviceDetector) {
	
    $scope.vm = deviceDetector;
    $scope.loadFull = true;
    
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
		$rootScope.usageEndTime = Date.today().setTimeToNow();
		$rootScope.usageEndTime.addSeconds(10);
		$rootScope.isWeekend = $scope.findWeekend($scope.usageEndTime.clearTime().getTime());
		console.log("isWeekend  ", $scope.isWeekend);

		
		
		DataService.getTouSchedules().then(
				function(res) {
					DataService.getHoliday().then(
							function(res) {
								$rootScope.holidayList = res;
								$rootScope.isHoliday = $scope.findHoliday($scope.usageEndTime.clearTime().getTime());
								console.log("isHoliday  ", $scope.isHoliday);
								$state.go("energy.plot");
							},
							function(error) {

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

				});
	}
	
	$scope.reload = function()
	{
		$state.reload("energy.plot");
	}
	
	$scope.formatCost = function(cost)
	{
		if(cost < 100)
			return "¢ " + cost;
		else
			return "$" + (cost/100); 
	}
	
	$scope.init();
	
}]);
