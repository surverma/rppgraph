var myapp = angular.module('myapp', ["ui.router"])
    myapp.config(function($stateProvider, $urlRouterProvider){
      
      // For any unmatched url, send to /route1
      $urlRouterProvider.otherwise("/energy");
      
      $stateProvider
        .state('energy', {
            url: '/energy',
            controller : "mainCtrl",
            views : {
				'energyPulse' : {
					templateUrl : 'views/energyPulse.html',
					controller : 'EnergyPulseController'
				},
				'smartMonitor' : {
					templateUrl : 'views/smartMonitor.html',
					controller : 'SmartMonitorController'
				}
			},
            onEnter: function(){
              console.log("enter contacts");
            }
    		
        })
    })