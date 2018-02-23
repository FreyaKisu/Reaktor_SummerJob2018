var serveStatic = require('serve-static');
var connect = require('connect');
const weatherDb = require('./weather-db');
var $ = require("jquery");

let observations = [];
weatherDb.connect();
weatherDb.getAllData(data => observations = data);

const port = process.env.PORT ? process.env.PORT : 3001;

/*
 API:
 GET	/observations
	gets all latest observations and min and max values for all locations
 POST	/observations/{location}/{temperature}
	adds a temperature observation for a location
*/

connect().use(serveStatic(__dirname)).use('/observations', (req, res) => {

	const locations = ['Tokio', 'Dubai', 'Helsinki', 'Amsterdam', 'New York'];

	const temperatureSanityCheck = temperature => 
		!isNaN(temperature) && temperature > -70 && temperature < 65;

	const validateAndAddObservation = (location, temperatureStr) => {
		const temperature = Number(temperatureStr);
		const errors = [
			{ error: "City not found", success: locations.some(c => c === location) },
			{ error: "Temperature invalid", success: temperatureSanityCheck(temperature) }
		].filter(check => !check.success).map(err => err.error);
		if (errors.length === 0) {
			const observation = {
				temperature,
				location,
				time: new Date()
			};
			observations.push(observation);
			weatherDb.saveObservation(observation);
		}
		return errors;
	};
	
	const calculateObservationsPerLocation = () => locations.map(location => {
		const obsSortByTime = observations
			.filter(obs => obs.location === location)
			.sort((a, b) => b.time.getTime() - a.time.getTime());
		const temp = value => value !== undefined ? value.toFixed(2) : undefined;
		const temperature = temp(obsSortByTime[0] ? obsSortByTime[0].temperature : undefined);
		const dayAgoMillis = new Date().getTime() - 24 * 3600 * 1000;
		const temperatures = obsSortByTime
			.filter(o => o.time.getTime() >= dayAgoMillis)
			.map(o => o.temperature)
			.sort((a, b) => a - b);
		const min = temp(temperatures[0]);
		const max = temp(temperatures[temperatures.length - 1]);
		return { location, temperature, min, max };
	});
/*
	// This will fetch current temperature from openweathermap API according to the user's coordinates.

	const getLocationForecast = (lat, lon) => {

		var apiKey = '6129ebfe553acbb2aa2d83cf9b5eafb8';
		var kelvin = 0;
		var celcius = 0;

		var url="http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + apiKey;

		$.getJSON(url, function(data) {
			kelvin = parseFloat(data.main.temp);
			celcius = parseFloat(kelvin - 273.15);
		});

		return celcius;
	};
	// Verifying if the user is on the correct location to store the temperature.

	function check_city(lat, lon) {

	var city = '';

	// We use only 4 decimals that this exercise match better for located area. :)

	lat = Math.trunc(lat * 10000) / 10000;
	lon = Math.trunc(lon * 10000) / 10000;

	// Allowed places for storing temperature values.

	var places = {
			'Tokio':      { lat: '35.6584', lon: '139.7328' },
			'Helsinki':   { lat: '60.1697', lon:  '24.9490' },
			'New York':   { lat: '40.7406', lon: '-73.9938' },
			'Amsterdam':  { lat: '52.3650', lon:   '4.9040' },
			'Dubai':      { lat: '25.0925', lon:  '55.1562' }
	};

	// This will find the city where the user is located.
	
	Object.keys(places).forEach(key => {
	if (places[key].lat == lat && places[key].lon == lon) {
		city = key;
		// There could be break..
	}
	});
	  
	// This will return located city or false if user is out of specific cities.
	if (city != "") {
			return city;
	} else {
			return 'FALSE';
	}
}
 
// Test example
lat = '40.74068888';
lon = '-73.99389999';
alert(check_city(lat, lon));
*/

	res.writeHead(200, { 'Content-Type': 'text/json' });
	if (req.method === 'GET') {
		res.end(JSON.stringify(calculateObservationsPerLocation()));
	} else if (req.method === 'POST') {
		const params = req.url.replace(/%20/g, ' ').replace('/', '').split('/');
		const errors = validateAndAddObservation(params[0], params[1]);
		res.end(JSON.stringify(errors.length === 0 ? 'ok' : errors));
	}

}).listen(port);
console.log('Server running at http://localhost:' + port);
