var serveStatic = require('serve-static');
var connect = require('connect');
const http = require('http');
const weatherDb = require('./weather-db');
var toFixed = require('tofixed');
 
let observations = [];
weatherDb.connect();
weatherDb.getAllData(data => observations = data);
 
const port = process.env.PORT ? process.env.PORT : 3001;
 
const locations = [
    { city: 'Tokio', coordinates: { lat: 35.6584, lon: 139.7328 } },
    { city: 'Dubai', coordinates: { lat: 25.0925, lon:  55.1562 } },
    { city: 'Helsinki', coordinates: { lat: 60.1697, lon:  24.9490 } },
    { city: 'Amsterdam', coordinates: { lat: 52.3650, lon:   4.9040 } },
    { city: 'New York', coordinates: { lat: 40.7406, lon: -73.9938 } }
];
 
// This will fetch current temperature from openweathermap API according user coordinates

function getLocationForecast(lat, lon, onReady) {
 
    var apiKey = '6129ebfe553acbb2aa2d83cf9b5eafb8';
    var kelvin = 0;
    var celcius = 0;
 
    // Test if the location is near any of the places:
	// (We use 0 decimals because 1 decimal is too fine)
	
    const place = locations.find(location => Math.abs(lat - location.coordinates.lat) < 1 && Math.abs(lon - location.coordinates.lon) < 1);
 
    if (place === undefined) {
        onReady();
        return;
    }
 
    var url="http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + apiKey;

    requestUrl(url, function(data) {
        console.log(data);
        kelvin = parseFloat(data.main.temp);
        celcius = parseFloat(kelvin - 273.15);
        onReady(place.city, toFixed(celcius, 0));
    });
}
 
const requestUrl = (url, callback) => {
    http.get(url, res => {
        res.setEncoding("utf8");
        let body = "";
        res.on("data", data => {
          body += data;
        });
        res.on("end", () => {
          body = JSON.parse(body);
          callback(body);
        });
      });
}
 
const fileServer = serveStatic(__dirname);
 
/*
 API:
 GET    /observations
    gets all latest observations and min and max values for all locations
 POST   /observations/{location}/{temperature}
    adds a temperature observation for a location
 POST   /location/{latitude}/{longitude}
    returns temperature if your current location is near a supported location
*/

// Preventing the visibility of backend files.

connect().use((req, res, fn) => {
    const serverFiles = [
        'weather-db.js',
        'server.js',
        'package.json'
    ];
    if (serverFiles.some(f => req.url.toLowerCase().indexOf(f) >= 0)) {
        res.writeHead(404);
        res.end();
        return;
    }
    return fileServer(req, res, fn);
}).use('/observations', (req, res) => {
    const temperatureSanityCheck = temperature =>
        !isNaN(temperature) && temperature > -70 && temperature < 65;
 
		// Adding the temperature and validating if it is a real value. 

    const validateAndAddObservation = (location, temperatureStr) => {
        const temperature = Number(temperatureStr);
        const errors = [
            { error: "City not found", success: locations.some(c => c.city === location) },
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
   
	// Checks the selected location and adds the temperature accordingly.
	
    const calculateObservationsPerLocation = () => locations.map(location => {
        const obsSortByTime = observations
            .filter(obs => obs.location === location.city)
            .sort((a, b) => b.time.getTime() - a.time.getTime());
        const temp = value => value !== undefined ? value.toFixed(0) : undefined;
        const temperature = temp(obsSortByTime[0] ? obsSortByTime[0].temperature : undefined);
        const dayAgoMillis = new Date().getTime() - 24 * 3600 * 1000;
        const temperatures = obsSortByTime
            .filter(o => o.time.getTime() >= dayAgoMillis)
            .map(o => o.temperature)
            .sort((a, b) => a - b);
        const min = temp(temperatures[0]);
        const max = temp(temperatures[temperatures.length - 1]);
        return { location: location.city, temperature, min, max };
    });
   
    res.writeHead(200, { 'Content-Type': 'text/json' });
    if (req.method === 'GET') {
        res.end(JSON.stringify(calculateObservationsPerLocation()));
    } else if (req.method === 'POST') {
        const params = req.url.replace(/%20/g, ' ').replace('/', '').split('/');
        const errors = validateAndAddObservation(params[0], params[1]);
        res.end(JSON.stringify(errors.length === 0 ? 'ok' : errors));
    }
})
.use('/location', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/json' });
    const params = req.url.replace('/', '').split('/');
    const lat = Number(params[0]);
    const lon = Number(params[1]);
    getLocationForecast(lat, lon, (location, temperature) => {
        const result = {error: location === undefined, location, temperature};
        res.end(JSON.stringify(result));
    });
})
.listen(port);
console.log('Server running at http://localhost:' + port);