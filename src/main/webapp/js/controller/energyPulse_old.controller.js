myapp.controller('EnergyPulseController',['$scope','$interval', '$http','DataService', function($scope, $interval, $http, DataService) {

	$scope.object = null;
	$scope.energyData = null;
	$scope.container = $('#container');
	$scope.redraw = function() {
		var data = $scope.dataTillNow(Date.now());
		$scope.container.highcharts().destroy();
		$scope.createGraph(data.energyData,data.costData,data.cumCostData,data.breakedUpCost);
		$scope.setPieText();
	};

	$scope.breakTotalCost = function(costData)
	{
		var off_peak = null;
		var on_peak = null;
		var mid_peak = null;

		$.each(costData, function( index, value ) {
			var costZone = $scope.getEnergyCost(value[0]);
			if(costZone == "off")
			{
				off_peak += value[1];
			}
			else if(costZone == "mid")
			{
				mid_peak += value[1];
			}
			else
			{
				on_peak += value[1];
			}
		});

		return {
			offCost : off_peak,
			midCost : mid_peak,
			onCost : on_peak
		};

	};
	
	$scope.peakFactorCalculator = function(costZone)
	{
		if($scope.isWeekend || $scope.isHoliday || costZone.peak == "TOU_OP")
			costZone.peakFactor = 1;
		else if(costZone.peak == "TOU_MP")
			costZone.peakFactor = 2;
		else if(costZone.peak == "TOU_CE")
			costZone.peakFactor = 10;
		else
			costZone.peakFactor = 3;
	}


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
					$scope.peakFactorCalculator(singleRow);
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
					$scope.peakFactorCalculator(singleRow);
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
							$scope.peakFactorCalculator(singleRow);
							return singleRow;
						}
					}
					else
					{
						if((inputHour >= splitedEffHour &&  inputHour <= 23) ||  (inputHour >= 0 &&  inputHour <= splitedEndHour))
						{
							$scope.peakFactorCalculator(singleRow);
							return singleRow;
						}
					}
				}

			});
			finalZone = Object.create(costZone[0]);
			if(time >= $scope.criticalStartTime.timeStamp && time <= ($scope.criticalStartTime.timeStamp + 60*60*1000))	
			{
				finalZone.peak = "TOU_CE";
			}
			$scope.peakFactorCalculator(finalZone);
		}
		
		return finalZone;
	};



	$scope.dataTillNow = function(_nowsec) {
		var _today = Date.today().getTime();
		var _cumCost = 0;
		var _intervalCost = 0;
		
		var _datadate = Date.today().clearTime().set({
			year : 2017,
			month : 6,
			day : 12
		}).getTime();
		var delta = _today - _datadate + 4*3600*1000;
		var energyData = [], costData = [], cumCostData = [], breakedUpCost = {}, i = 0;
		breakedUpCost.offPeak = 0;
		breakedUpCost.midPeak = 0;
		breakedUpCost.onPeak = 0;
		
		for (i = 0; i < $scope.energyData.length; i++) {
			var _zObject = {};
			_zObject.offPeakFactor = $scope.offPeakFactor;
			var utime = delta+$scope.energyData[i][0] * 1000;
			if(!$scope.loadFull && utime > _nowsec){
				break;
			}
			var costZone = $scope.getEnergyCost(utime);
			_zObject.peakFactor = costZone.peakFactor;
			_zObject.price = costZone.price;
			if(i>0)
			{
				var prevUtime = delta+$scope.energyData[i-1][0] * 1000;
				_zObject.timeInterval =  (utime - prevUtime)/(1000*60); //minute
			}
			else
			{
				_zObject.timeInterval = 0;
			}
			
			_intervalCost = (($scope.energyData[i][1]/1000) * costZone.price);// (kwh * c/kwh * hour)
			_cumCost += _intervalCost; 
			
			if(costZone.peak == "TOU_OP")
				breakedUpCost.offPeak += _intervalCost;
			else if(costZone.peak == "TOU_MP")
				breakedUpCost.midPeak += _intervalCost;
			else
				breakedUpCost.onPeak += _intervalCost;

			energyData.push({
				x : utime,
				y : ($scope.energyData[i][1]/1000),
				z : _zObject
			}); //kwh

			costData.push({
				x : utime,
				y : ($scope.energyData[i][1]/1000) * (costZone.price / _zObject.offPeakFactor * costZone.peakFactor), // ()
				z : _zObject
			});//cent/kwh

			cumCostData.push({
				x : utime,
				y : _cumCost,
				z : _zObject
			}); //cent
		}
		return {
			energyData : energyData,
			costData : costData,
			cumCostData : cumCostData,
			breakedUpCost : breakedUpCost
		};
	};

	$scope.createGraph = function(edata, pdata, cdata, pieData) {
		var chartOption = new EnergyPulseGraphOption();
		//chartOption.subtitle.text = Date.today().toLongDateString() + "<br>Today's Energy Cost : <b>¢" + $scope.totalCost.toFixed(2) + "</b>";
		chartOption.subtitle.text = Highcharts.dateFormat('%A, %B %d,%Y', Date.today()) + "<br>Today's Energy Cost : <b>" + $scope.formatCost($scope.totalCost) + "</b>";
		var legendColor = ["rgb(0, 102, 153)","rgb(102, 102, 51)","rgb(160, 84, 3)"];
		var areaColor = ["rgb(135, 181, 76)","rgb(246, 208, 35)","rgb(196, 84, 75)","rgb(221, 183, 10)","rgb(135, 180, 81)"];
		var gradientSpace = {
				x1 : 1,
				y1 : 0,
				x2 : 1,
				y2 : 1
		};
		
		var _plotBand = [{
			color: 'orange', // Color value
			from: Date.today().addHours($scope.criticalStartTime.hours).addMinutes($scope.criticalStartTime.minutes).getTime(), // Start of the plot band
			to: Date.today().addHours($scope.criticalStartTime.hours+1).addMinutes($scope.criticalStartTime.minutes).getTime(),
			label: { 
				text: '<b>Critical</b><br> <b>Event</b>', // Content of the label. 
				align: 'center' // Positioning of the label. 
			}// End of the plot band
		}];
		
		var _zonesWithColorGrad = [ {
			value : Date.today().addHours(7),
			color : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(135, 181, 76)' ], [ 1, 'rgb(135, 181, 76)' ] ]
			}
		}, {
			value : Date.today().addHours(11),
			color : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(246, 208, 35)' ], [ 1, 'rgb(246, 208, 35)' ] ]
			}
		}, {
			value : Date.today().addHours(17),
			color : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(196, 84, 75)' ], [ 1, 'rgb(224, 163, 159)' ] ]
			}
		}, {
			value : Date.today().addHours(19),
			color : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(221, 183, 10)' ], [ 1, 'rgb(250, 233, 158)' ] ]
			}
		}, {
			value : Date.today().addHours(24),
			color : {
				linearGradient : gradientSpace,
				stops : [ [ 0, 'rgb(135, 180, 81)' ], [ 1, 'rgb(194, 217, 166)' ] ]
			}
		} ];
		
		var _zonesWithSolidColor = [ {
			value : Date.today().addHours(7),
			color : areaColor[0]
		}, {
			value : Date.today().addHours(11),
			color : areaColor[1]
		}, {
			value : Date.today().addHours(17),
			color : areaColor[2]
		}, {
			value : Date.today().addHours(19),
			color : areaColor[3]
		}, {
			value : Date.today().addHours(24),
			color : areaColor[4]
		} ];
		
		var _zonesWithClass = [ {
			value : Date.today().addHours(7),
			className: 'zone-off-energy'
		}, {
			value : Date.today().addHours(11),
			className: 'zone-mid-energy'
		}, {
			value : Date.today().addHours(17),
			className: 'zone-on-energy'
		}, {
			value : Date.today().addHours(19),
			className: 'zone-mid-energy'
		}, {
			value : Date.today().addHours(24),
			className: 'zone-off-energy'
		} ];
		
		
		var _series = [];
		_series.push({
			name : 'Energy',
			lineWidth: 1,
			color : legendColor[0],
			data : edata,
			zoneAxis : 'x',
			zones : (($scope.isHoliday || $scope.isWeekend)? null:_zonesWithSolidColor),
			fillColor : (($scope.isHoliday || $scope.isWeekend)? areaColor[0]:null),
			fillOpacity: 0.7
		});

		_series.push({
			name : 'Cost',
			lineWidth: 1,
			color : legendColor[1],
			data : pdata,
			yAxis : 0,
			zoneAxis : 'x',
			zones : (($scope.isHoliday || $scope.isWeekend)? null:_zonesWithSolidColor),
			fillColor : (($scope.isHoliday || $scope.isWeekend)? areaColor[0]:null),
			fillOpacity: 0.5
		});

		_series.push({
			name : 'Cumulative cost',
			data : cdata,
			type : 'line',
			yAxis : 1,
			color : legendColor[2],
			lineWidth : 1
		});
		
		_series.push({
			type: 'pie',
	        name: 'Total cost',
	        tooltip : {
	    			borderWidth : 0,
	    			useHTML : true,
	    			style : {
	    				padding : 0,
	    			},
	    			pointFormat: '{series.name}: <b>{point.y}</b><br/>',
	    			shared : true
	    	},
	        data: createPieChartdata(pieData),
	        innerSize: '60%',
	        center: [30, -30],
	        size: 100,
	        showInLegend: false,
	        dataLabels: {
	            enabled: false
	        }
		});
		
		chartOption.series = _series;
		chartOption.xAxis.plotBands = _plotBand;
		$scope.chart = new Highcharts.chart(chartOption);

	};

	/*$scope.createPieGraph = function(breakUpCost,totalCost) {
		var chartOption = new EnergyPulseMonitorOption();
		var _series = [
			{
		        name: 'Critical',
		        data: [{
		            color: Highcharts.getOptions().colors[5],
		            radius: '112%',
		            innerRadius: '88%',
		            y: 70
		        }]
		    }, 
			{
				name: 'On-Peak',
				data: [{
					color: Highcharts.getOptions().colors[1],
					radius: '112%',
					innerRadius: '88%',
					y: ((breakUpCost.onCost + breakUpCost.midCost + breakUpCost.offCost)*100/totalCost)
				}]
			},
			{
				name: 'Mid-Peak',
				data: [{
					color: Highcharts.getOptions().colors[2],
					radius: '112%',
					innerRadius: '88%',
					y: ((breakUpCost.midCost + breakUpCost.offCost)*100/totalCost)
				}]
			}, 
			{
				name: 'Off-Peak',
				data: [{
					color: Highcharts.getOptions().colors[0],
					radius: '112%',
					innerRadius: '88%',
					y: (breakUpCost.offCost*100/totalCost)
				}]
			}
			,

		    {
		        name: 'Goal',
		        data: [{
		            color: Highcharts.getOptions().colors[8],
		            radius: '87%',
		            innerRadius: '63%',
		            y: 65
		        }]
		    }, {
		        name: 'Average',
		        data: [{
		            color: Highcharts.getOptions().colors[9],
		            radius: '62%',
		            innerRadius: '38%',
		            y: 50
		        }]
		    }];
		chartOption.series = _series;
		console.log("Pie chart options",chartOption);
		pie_chart = new Highcharts.chart(chartOption);

	};*/
	
	$scope.updateGraph = function(edata, pdata, cdata, pieData) {
		var eseries = $scope.chart.series[0];
		eseries.addPoint(edata, true);

		var pseries = $scope.chart.series[1];
		pseries.addPoint(pdata, true);

		var cseries = $scope.chart.series[2];
		cseries.addPoint(cdata, true);
		
		var pieseries = $scope.chart.series[3];
		pieseries.setData(createPieChartdata(pieData));
	};
	/*$scope.updatePulseMeter= function(breakUpCost,totalCost) {
		if(pie_chart)
		{
			pie_chart.series[0].points[0].update((breakUpCost.onCost + breakUpCost.midCost + breakUpCost.offCost)*100/totalCost);
			pie_chart.series[1].points[0].update((breakUpCost.midCost + breakUpCost.offCost)*100/totalCost);
			pie_chart.series[2].points[0].update(breakUpCost.offCost*100/totalCost);
		}
		console.log("Updating pulse graph",pie_chart);
	};*/
	$scope.fetchInitialUsageData = function() {
		//$scope.usageEndTime= Date.now();
		$scope.totalCost = 0;
		$scope.createGraph([], [], [], []);
		DataService.getEnergyData('energyDataRandomInterval.json').then(
				function(res) {
					$scope.energyData = res;
					$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
					$scope.totalCost = $scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length-1].y;
					$scope.createGraph($scope.seriesData.energyData, $scope.seriesData.costData, $scope.seriesData.cumCostData,$scope.seriesData.breakedUpCost);
					$scope.setPieText();
					if($scope.online)
					{
						$interval(function() {
							console.log('fetch data');
							$scope.realtimeUsageData();
						}, 1000);
					}
				},
				function(error) {

				});
			
			//$scope.createPieGraph(breakUpCost,$scope.totalCost);

	}
	
	$scope.setPieText = function()
	{
		var position = null,
		plotLine,
		newx,
		d,
		xAxis = $scope.chart.xAxis[0],
		rend = $scope.chart.renderer,
		pie = $scope.chart.series[3],
		left = $scope.chart.plotLeft + pie.center[0],
        top = $scope.chart.plotTop + pie.center[1],
        totalCost = pie.yData[0] + pie.yData[1] + pie.yData[2];
        $scope.pieText = rend.text("¢<b>" + $scope.formatCost(totalCost) + "</b>", left,  top).attr({ 'text-anchor': 'middle'}).add();
	}
	
	$scope.realtimeUsageData = function() {
		$scope.usageEndTime = Date.today().setTimeToNow();
		$scope.seriesData = $scope.dataTillNow($scope.usageEndTime.getTime());
		/*$scope.totalCost = _.reduce($scope.seriesData.costData, function(memo, num) {
			return memo + num[1]
		}, 0);*/
		//var breakUpCost = $scope.breakTotalCost($scope.seriesData.costData);
		$scope.updateGraph($scope.seriesData.energyData[$scope.seriesData.energyData.length - 1],
				$scope.seriesData.costData[$scope.seriesData.costData.length - 1],
				$scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length - 1],
				$scope.seriesData.breakedUpCost);
		$scope.totalCost = $scope.seriesData.cumCostData[$scope.seriesData.cumCostData.length-1].y;
		$scope.chart.setTitle(null, { text: Highcharts.dateFormat('%A, %B %d,%Y', Date.today()) + 
			"<br>Today's Energy Cost : <b>" + $scope.formatCost($scope.totalCost) + "</b>" }); 
		$scope.pieText.textSetter("<b>" + $scope.formatCost($scope.totalCost) + "</b>")
		//$scope.updatePulseMeter(breakUpCost,$scope.totalCost);
	}
	$scope.fetchInitialUsageData();
	
}]);
