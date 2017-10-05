function HttpResponse(code, msg) {
	this.status = code;
	this.statusText = msg;
}

'use strict';
myapp.service('DataService', function($q, $http, $rootScope,$cookies) {


	this.getHoliday = function() {
		//TODO Replace by actual service call
		var holidayResponse = $http.get(LHConfig.holidayURL);
		var result = $q.defer();
		$q.all([ holidayResponse ]).then(function(responses) {
			var holidayData = responses[0].data;
			result.resolve(holidayData);
		});
		return result.promise;
	};


	this.getTouSchedules = function() {
		//TODO Replace by actual service call
		var touResponse = $http.get(LHConfig.touSchedulesURL);
		var result = $q.defer();
		$q.all([ touResponse ]).then(function(responses) {
			var touData = responses[0].data;
			result.resolve(touData);
		});
		return result.promise;
	};

	this.getOutletData = function(outlets) {
		//TODO Replace by actual service call
		var outletResponses = [];
		angular.forEach(outlets, function(value, key) {
			outletResponses.push($http.get(LHConfig.usageDataHost + "/" + key + ".json"))
		});
		
		var result = $q.defer();
		$q.all(outletResponses).then(function(responses) {
			var outletData = outlets;
			angular.forEach(responses, function(value, key) {
				outletData[key].data = value.data;
			});
			result.resolve(outletData);
		});
		return result.promise;
	};

	this.getDemoEnergyData = function(meter) {
		//TODO Replace by actual service call
		var energyResponse = $http.get(LHConfig.usageDataHost + "/" + meter);
		var result = $q.defer();
		$q.all([ energyResponse ]).then(function(responses) {
			var energyData = responses[0].data;
			result.resolve(energyData);
		});
		return result.promise;
	};
	
	this.getEnergyData = function(startTime,endTime,interval) {
		//TODO Replace by actual service call
		var clientToken=$cookies.get('RPP_KEY');
		var req = {
				method: 'GET',
				url: "https://yo5cgvdqgc.execute-api.us-east-1.amazonaws.com/prod/usageapi?start="
					+ startTime + "&end=" + endTime + "&interval=" + interval,
					headers: {
						'clientToken' : clientToken,
						'x-api-key' : 'lxaiz8A8kA6XlSN8CSpbYaFmt9INwuA99D7TeWAf',
						'Content-Type': 'application/json'
					}
		}
		var energyResponse = $http(req);
		var result = $q.defer();
		$q.all([ energyResponse ]).then(function(responses) {
			var energyData = responses[0].data;
			result.resolve(energyData);
		}, function(error) {
			console.log('err ', error);
			result.reject(new HttpResponse(error.status, error.message));
		});
		return result.promise;
	};
	
	this.getHubStatus = function(meterId) {
		//TODO Replace by actual service call
		var clientToken=$cookies.get('RPP_KEY');
		var req = {
				method: 'GET',
				url: "https://yo5cgvdqgc.execute-api.us-east-1.amazonaws.com/prod/hub/E377269/statuses",
					headers: {
						'clientToken' : clientToken,
						'x-api-key' : 'lxaiz8A8kA6XlSN8CSpbYaFmt9INwuA99D7TeWAf',
						'Content-Type': 'application/json'
					}
		}
		var energyResponse = $http(req);
		var result = $q.defer();
		$q.all([ energyResponse ]).then(function(responses) {
			var hubStatusData = responses[0].data;
			result.resolve(hubStatusData);
		}, function(error) {
			console.log('err ', error);
			result.reject(new HttpResponse(error.status, error.message));
		});
		return result.promise;
	};

});