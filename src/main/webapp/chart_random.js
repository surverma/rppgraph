var hasPlotLine = false;
var chart = null;

Date.prototype.YYYYMMDD = function() {
	return this.toString("yyyy-MM-dd");
};



function drawPlotLine() {
	if (!hasPlotLine) {
		chart.xAxis[0].addPlotLine({
			value: new Date().getTime(),
			color: 'black',
			width: 2,
			dashStyle: 'shortdash',
			id: 'plot-line-1',
			label: {
				rotation : 0,
				text: "<div>now<br>" + formatDate(new Date()) + "</div>"
			}
		});
	} else {
		chart.xAxis[0].removePlotLine('plot-line-1');
	}
	hasPlotLine = !hasPlotLine;
};

function formatDate(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var second = date.getSeconds();
	return "(" + hours + ":" + minutes + ":" + second + ")";
};

function getTimeSlab(date) {
	var myDate = new Date(date);
	if ( myDate.getHours() == 0)  
	{ 
	    return "midnight";
	}
	if ( myDate.getHours() > 0 && myDate.getHours() <= 5 )  
	{ 
	    return "early morning";
	}
	if ( myDate.getHours() > 5 && myDate.getHours() < 12 ) 
	{ 
		return "morning";
	} 
	if ( myDate.getHours() == 12) 
	{ 
		return "noon";
	} 
	if ( myDate.getHours() > 12 && myDate.getHours() <= 16) 
	{ 
		return "afternoon";
	}
	if ( myDate.getHours() > 16 && myDate.getHours() < 23) 
	{ 
		return "evening";
	} 
}

function timeSlabFormatter() {
	return getTimeSlab(this.value);
}


var dataTillNow= [];
dataTillNow =  (function () {
	// generate an array of random data
	var data = [],
	now = new Date(),
	startTime = new Date().setHours(0,0,0,0),
	endTime = new Date().setHours(23,59,59,999),
	i;
	for (i = startTime/1000; i <= endTime/1000; i += 1) {
		if(i <= new Date().getTime()/1000)
		{
			data.push([
				i*1000,
				Math.round(Math.random() * 100)
				]);
		}
		else
		{
			data.push([
				i*1000,
				null
				]);
		}
	}
	return data;
}());


var object = {
		chart: {
			type : 'area',
			renderTo: 'container',
			events: {
				load: function () {

					// set up the updating of the chart each second
					var series = this.series[0];
					setInterval(function () {
						var x = (new Date()).getTime(), // current time
						y = Math.round(Math.random() * 100);
						series.addPoint([x, y], true, true);

					}, 1000);
				}
			}
		},
		credits : 
		{
			enabled : false
		},		
		navigator: {
			enabled: false
		},
		scrollbar: {
			enabled: false
		},
		rangeSelector: {
			selected: 4,
			inputEnabled: false,
			buttonTheme: {
				visibility: 'hidden'
			},
			labelStyle: {
				visibility: 'hidden'
			}
		},

		title: {
			text: 'Real Time Energy Usage'
		},

		exporting: {
			enabled: false
		},

		yAxis: {
			title : {
				text : 'Energy Usage/Cost'
			},
			labels: {
				enabled: false
			},
			plotLines: [{
				value: 1,
				width: 0,
				zIndex : 999,
				label: {
					text: "<div><strong>Today's Energy Cost<br>$2.56</strong></div>",
					align: 'left',
					y: -50,
					x: 50
				}
			},
			{
				value: 1,
				width: 0,
				zIndex : 999,
				label: {
					text: new Date(),
					align: 'center',
					verticalAlign: 'top',
					y: -300
				}
			}
			]
		},
		xAxis : {
			labels : {
				formatter : timeSlabFormatter
			},
			tickInterval: 4*60*60*1000
		},
		plotOptions: {
			series: {
				zoneAxis: 'x',
				zones: [{
					value: new Date().setHours(07,00,00,000),
					color: '#86b300'
				}, {
					value: new Date().setHours(11,00,00,000),
					color: '#ffcc00'
				}, {
					value : new Date().setHours(17,00,00,000),
					color: '#cc2900'
				},
				 {
					value : new Date().setHours(19,00,00,000),
					color: '#ffcc00'
				},
				 {
					value : new Date().setHours(23,59,59,999),
					color: '#86b300'
				}
				],
			}},

			series: [{
				name: 'Random data',
				data: dataTillNow
			}]
};



Highcharts.setOptions({
	global: {
		useUTC: false
	}
});

$( document ).ready(function() {
	console.log( "ready!" );
	chart = new Highcharts.StockChart(object);
	window.setInterval(function(){
		drawPlotLine();
	}, 500);
});

var app = angular.module('myApp', []);

app.controller('myCtrl', function($scope, $http) {

});






