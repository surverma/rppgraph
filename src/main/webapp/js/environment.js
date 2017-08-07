var LHConfig = LHConfig || {};
LHConfig.touSchedulesURL = 'https://rppapi-dot-api-dot-lh-myaccount-dev.appspot.com/api/v1/public/touSchedules';
LHConfig.holidayURL = 'https://rppapi-dot-api-dot-lh-myaccount-dev.appspot.com/api/v1/cms/lhHolidays?year=2017';
if (document.domain.indexOf('local') >= 0) {
	LHConfig.usageDataHost = '/rpp/data';
}
else
{
	LHConfig.usageDataHost = '/data';
}

