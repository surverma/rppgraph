var myapp = angular.module('myapp', ["ui.router","ng.deviceDetector"])
    myapp.config(function($stateProvider, $urlRouterProvider,deviceDetectorProvider){
      // For any unmatched url, send to /route1
      $urlRouterProvider.otherwise("/energy/null/null");
      
      $stateProvider
      .state('energy', {
    	  url: '/energy/{billingId}/{serviceId}',
    	  controller: 'MainCtrl',
    	  templateUrl: 'views/energy.html',
    	  onEnter : [ '$rootScope', '$stateParams', '$state',
    	  function($rootScope, $stateParams, $state) {
    	  //document.location = ApplConfig.myAccountUrl;
    		  $rootScope.billingId = $stateParams.billingId;
    		  $rootScope.serviceId = $stateParams.serviceId;
    	  } ]
      })
        .state('energy.plot', {
            url: '',
            views : {
            	'': {
                    templateUrl: 'views/energy.html'
                  },
				'energyPulse@energy' : {
					templateUrl : 'views/energyPulse.html',
					controller : 'EnergyPulseController'
				},
				'smartMonitor@energy' : {
					templateUrl : 'views/smartMonitor.html',
					controller : 'SmartMonitorController'
				}
			},
            onEnter: function(){
              console.log("enter contacts");
            }
        })
    })