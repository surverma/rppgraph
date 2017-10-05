var myapp = angular.module('myapp', ["ui.router","ng.deviceDetector","ngCookies"])
    myapp.config(function($stateProvider, $urlRouterProvider,deviceDetectorProvider,$cookiesProvider){
      // For any unmatched url, send to /route1
      $urlRouterProvider.otherwise("/energy/E377269");
      
      $stateProvider
      .state('energy', {
    	  url: '/energy/:meter',
    	  controller: 'MainCtrl',
    	  templateUrl: 'views/energy.html',
    	  onEnter : [ '$rootScope', '$stateParams', '$state',
    	  function($rootScope, $stateParams, $state) {
    	  //document.location = ApplConfig.myAccountUrl;
    		  $rootScope.meterId = $stateParams.meter;
    		  $rootScope.meterId = 'E377269';
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
            }
        })
    })
    myapp.directive('download', [ '$filter', $$download ]);
	function $$download($filter) {
		return {
			restrict : 'A',
			require : 'ngModel',
			scope : {
				downloadOption : '='
			},
			link : function(scope, element, attrs, ngModel) {
				element.bind('click', function(e) {
					var csvString = '';
					var _colcount = 0;
					if (scope.downloadOption.header) {
						_.each(scope.downloadOption.columns, function(opt, index) {
								if (_colcount > 0) {
									csvString += ",";
								}
								csvString += opt.label;
								_colcount++;
						})
						csvString += "\n";
					}
					_.each(ngModel.$viewValue, function(record, index) {
						_colcount = 0;
						_roles = "";
						_.each(scope.downloadOption.columns, function(opt, index2) {
								if (_colcount > 0) {
									csvString += ",";
								}
								_colcount++;
								if(opt.label == "Time"){
									csvString +=$filter('date')((record[opt.name]), "yyyy-MM-dd HH:mm");
								}
								else if(opt.label.indexOf("Cost")>=0){
									csvString += record[opt.name].toFixed(2);
								}
								else if(opt.label.indexOf("Usage")>=0){
									csvString += record[opt.name].toFixed(3);
								}
								/*if (angular.isArray(opt.format) && opt.format.length == 2) {
									//This portion is checking whether date is present in record then formatting is done otherwise instead of showing null - is shown
									if(record[opt.name] != null){
										csvString += $filter(opt.format[0])(record[opt.name], opt.format[1]);
									}else{
										csvString +="-";
									}
								}
								else if (angular.isArray(opt.format) && opt.format.length == 3) {
									csvString += $filter(opt.format[0])(record[opt.name], opt.format[1],opt.format[2]);
								} else if (opt.name == "premiseAddress") {
									csvString += (record[opt.name])[opt.format];
								} else if (opt.format == "csaSigned") {
									if ((record[opt.name]) == 0)
										csvString += "No";
									else
										csvString += "Yes";
								} else if (opt.format == "tenantOccupied") {
									if ((record[opt.name]) == 0)
										csvString += "Owner";
									else
										csvString += "Tenant";
								} else if (opt.format == "connectionStatus") {
									if ((record[opt.name]) == 1)
										csvString += "Connected";
									else
										csvString += " Disconnected";
								} else if (opt.format == "moveinPending") {
									if ((record).isPendingMoveIn() == true)
										csvString += "Move-In";
									else if ((record).isPendingMoveOut() == true)
										csvString += "Move-Out";
									else
										csvString += "No Pending Move";
								} else if (opt.format == "maxMoveinDate") {
									if ((record).isPendingMoveIn() == true)
										csvString += $filter('date')((record["moveinDate"]), "yyyy-MM-dd", 'UTC-5');
									else if ((record).isPendingMoveOut() == true)
										csvString += $filter('date')((record["moveoutDate"]), "yyyy-MM-dd", 'UTC-5');
									else
										csvString += "No Pending Move in / out Date";
								} else if (opt.format == "electricity") {
									if (((record["services"]).electricity && (record["services"]).electricity.length > 0) 
									 && ((record["services"]).water && (record["services"]).water.length > 0))
										csvString += "E-"+(record["services"]).electricity[0]+" W-"+(record["services"]).water[0];
									else if ((record["services"]).electricity && (record["services"]).electricity.length > 0)
										csvString += "E-"+(record["services"]).electricity[0];
									else if ((record["services"]).water && (record["services"]).water.length > 0)
										csvString += "W-"+(record["services"]).water[0];
									else
										csvString += "No Connections";
									
								} else if (opt.format == "convertToMeterCube") {
									csvString += $filter(opt.format)(record[opt.name]);
								} else if (opt.name == "status") {
									if(opt.format)
										csvString += (record[opt.name])[opt.format];
									else
										csvString += (record[opt.name]);
								} else if (opt.name == "roles") {
									if (angular.isArray(record[opt.format]) && record[opt.format].length > 1) {
										_.each(record[opt.format], function(role, index) {
											if (_roles == "") {
												_roles += (role)['authority'];
											} else {
												_roles += " / " + (role)['authority'];
											}
										});
										csvString += _roles;
									} else {
										csvString += (record[opt.format][0])['authority'];
									}
								} else {
									if (record[opt.name] != null) {
										//This portion is checking for comma present in the string or not
										if(typeof record[opt.name]==="string" && (record[opt.name]).indexOf(",")>=0)
											csvString += "\""+record[opt.name]+"\"";
										else
											csvString += record[opt.name];
									} 
									else {
										csvString += "-";
									}
								}*/
						});
						csvString += "\n";
					});
					
					if (navigator.msSaveBlob) { // IE 10+
						var blob = new Blob([csvString],{type: "text/csv;charset=utf-8;"});
						navigator.msSaveBlob(blob, scope.downloadOption.fileName);
					
					} else {
					    	var a = $('<a/>', {
								style : 'display:none',
								href : 'data:application/octet-stream;base64,' + btoa(csvString),
								download : scope.downloadOption.fileName
							}).appendTo('body')
							a[0].click()
							a.remove(); 
					}
				});
			}
		}
	}
	;