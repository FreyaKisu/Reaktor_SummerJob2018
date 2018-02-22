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
/*
function check_city($lat, $lon) {

	// Allowed places to use and store temperature values..
	$places = array(
		'Perttula'	=> array('lat' => '60.4198878', 'lon' =>  '24.6566230'),
		'Tokio' 	=> array('lat' => '35.6584421', 'lon' => '139.7328635'),
		'Helsinki' 	=> array('lat' => '60.1697530', 'lon' =>  '24.9490830'),
		'New York' 	=> array('lat' => '40.7406905', 'lon' => '-73.9938438'),
		'Amsterdam' 	=> array('lat' => '52.3650691', 'lon' =>   '4.9040238'),
		'Dubai' 	=> array('lat' => '25.0925350', 'lon' =>  '55.1562243')
	);

	// Let's go array thru and check if user location coordinates are on same..
	foreach($places as $row => $key) {
		if ($lat == $key['lat'] && $lon == $key['lon']) {
			$city = $row;
//			break;
		}
	}

	if (isset($city)) {
		return $city;
	} else {
		return FALSE;
	}
}


*/
// This will fetch current temperature from openweathermap API according user coordinates
function getLocationForecast(lat, lon) {

	var apiKey = '6129ebfe553acbb2aa2d83cf9b5eafb8';
	var kelvin = 0;
	var celcius = 0;

	var url="http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + apiKey;

	$.getJSON(url, function(data) {
		kelvin = parseFloat(data.temp);
		celcius = parseFloat(kelvin - 273.15);
	});

	return celcius;
}


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
