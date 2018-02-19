var serveStatic = require('serve-static');
var connect = require('connect');
const weatherDb = require('./weather-db');

let observations = [];
weatherDb.connect();
weatherDb.getAllData(data => observations = data);
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
			.filter(o => o.time >= dayAgoMillis)
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
}).listen(3001);
console.log('Server running at http://localhost:3001/');