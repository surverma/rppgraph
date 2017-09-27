myapp.controller('MainCtrl',['$scope','$rootScope', '$interval', '$http','DataService','$state','deviceDetector','$interval', function($scope,$rootScope, $interval, $http,DataService,$state,deviceDetector,$interval) {
	
    $scope.vm = deviceDetector;
    var timerInterval;
    
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
	
	$scope.getSeasonName = function (schedules) {
		var seasonname = '';
		for(var sch = 0; sch < schedules.length; sch++) {
			if(angular.uppercase(schedules[sch].season) != 'HOLIDAY' && angular.uppercase(schedules[sch].season) != 'WEEKEND') {
				seasonname = schedules[sch].season;
				break;
			}				
		}
		return seasonname == '' ? schedules[0].season : seasonname;
	};
	
	$scope.formatHour = function(hrMinSec) {
		if(typeof hrMinSec != "undefined")
		{
			var hour = hrMinSec.substring(0, 2);
			var min = hrMinSec.substring(3, 5);
			if(hour.includes(":")){
				hour = hour.replace(":","");
				min =  hrMinSec.substring(2, 4);
			}

			var amPM = "AM";
			if(hour > 12) {
				hour = hour - 12;
				amPM = "PM";
			}
			if(hour == 0)
				hour = 12;
			return hour + ":" + min + " " + amPM;
		}
	};
	
	$scope.setYear = function(schedules) {
		var currentHolidayScheduleYear = [];
		if(!schedules || schedules.length == 0)
			currentHolidayScheduleYear[0] = new Date().getFullYear();

		var effDateYear = new Date(schedules[0].effDate).getFullYear();
		var endDateYear = new Date(schedules[0].endDate).getFullYear();
		if(effDateYear == endDateYear)
			currentHolidayScheduleYear[0] = effDateYear;
		else {
			currentHolidayScheduleYear[0] = effDateYear;
			currentHolidayScheduleYear[1] = endDateYear;
		}

		$scope.currentHolidayScheduleYear = currentHolidayScheduleYear;
	};
	
	$scope.convertToUTC = function(dt) {
		if(dt != null){
			var localDate = new Date(dt);
			var localTime = localDate.getTime();
			var localOffset = localDate.getTimezoneOffset() * 60000;
			return new Date(localTime + localOffset);
		}else{
			return "";
		}
	};
	
	$scope.getOffPeak = function (item) {
		return item.season.toUpperCase() != 'HOLIDAY' && item.season.toUpperCase() != 'WEEKEND' && item.peak == 'TOU_OP';
	};

	$scope.getMidPeak = function (item) {
		return item.season.toUpperCase() != 'HOLIDAY' && item.season.toUpperCase() != 'WEEKEND' && item.peak == 'TOU_MP';
	};
	
	$scope.getCriticalPeak = function (item) {
		return item.peak == 'TOU_CP';
	};

	$scope.getPeak = function (item) {
		return item.season.toUpperCase() != 'HOLIDAY' && item.season.toUpperCase() != 'WEEKEND' && item.peak == 'TOU_PK';
	};

	$scope.getWeekendHolidayPeak = function (item) {
		return item.season.toUpperCase() == 'HOLIDAY' || item.season.toUpperCase() == 'WEEKEND';
	};

	$scope.filterTOUSchedules = function(touSchedules) {
		if(!touSchedules || touSchedules.length == 0)
			return;
		var schedules = touSchedules;
		schedules.sort(
	    		function (a, b) {
	    			 return a.effDate>b.effDate ? -1 : a.effDate<b.effDate ? 1 : 0; 
	 			});
		var result = new Array();
		var effDate;
		var index = -1;
		for(var sch in schedules) {
			if(effDate != schedules[sch].effDate) {
				index++;
				result[index] = [];
				effDate = schedules[sch].effDate;
			}
			result[index].push(schedules[sch]);
		}
		$scope.chartTOUSchedules = result;	
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
		console.log("isWeekend  ", $scope.isWeekend);
		
		DataService.getTouSchedules().then(
				function(res) {
					$scope.filterTOUSchedules(res);
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
		$scope.counter = $scope.refreshRate;
		$state.reload("energy.plot");
	}
	
	$scope.stopAllIntervals = function(){
		angular.forEach(intervals, function(interval) {
		    $interval.cancel(interval);
		});
	}
	
	$scope.formatCost = function(centValue)
	{
		if(centValue < 100 && centValue > 0)
			return "¢" + centValue.toFixed(2);
		else if(centValue >= 100)
			return "$" + (centValue/100).toFixed(2); 
		else 
			return " ";
	}
	
	$scope.init();
	
}]);
