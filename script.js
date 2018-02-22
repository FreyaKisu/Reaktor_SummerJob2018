//changing random bgimg

$(document).ready(function(){
	var classCycle=['bg1','bg2','bg3','bg4','bg5','bg6','bg7','bg8',
		'bg9','bg10','bg11','bg12','bg13','bg14','bg15','bg16','bg17'];

    var randomNumber = Math.floor(Math.random() * classCycle.length);
    var classToAdd = classCycle[randomNumber];

    $('.container-with-bgimg').addClass(classToAdd);

});
/*
var geolocation = require('geolocation-360');
var init = {
    googleApiKey: 'google api key',
    openCellIdApiKey: 'open cell id token',
    mcc: '515', //supply for default value
    mnc: '03', //supply for default value
};
 
geolocation.initialize(init);


 var x = document.getElementById("demo");

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition);
	} else { 
		x.innerHTML = "Geolocation is not supported by this browser.";
	}
}

function showPosition(position) {
	x.innerHTML = "Latitude: " + position.coords.latitude + "<br>Longitude: " + position.coords.longitude;
	refreshPage(position.coords.latitude, position.coords.longitude);
}

function refreshPage(lat, lon) {
	newUrl = 'https://myy.haaga-helia.fi/~a1703056/WeatherObservationApp/' + lat + '&lon=' + lon;
	document.location.href = newUrl;
}

/*$(document).ready(function() {
	if (window.location.href.contains("lat") > -1 && window.location.href.contains("lon") > -1) {

	} else {
		getLocation();
	}
});*/

const makeRequest = (url, method, onReady) => {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			onReady(JSON.parse(xhttp.responseText));
		}
	};
	console.log(url);
	xhttp.open(method, url, true);
	xhttp.send();
};

const updateObservations = () => {
	makeRequest('/observations', 'GET', observations => {
		const titleRow = {
			location: 'City',
			temperature: 'Temperature. (&#8451;)',
			min: 'Min. temp. (&#8451;)',
			max: 'Max. temp. (&#8451;)'
		};
		const obsTable = [titleRow].concat(observations).map(obs => {
			const div = content => '<div class="cell" >' + (content ? content : '---') + '</div>';
			return div(['location', 'temperature', 'min', 'max'].map(prop => obs[prop]).map(div).join(''));
		}).join('');

		document.getElementById('observations').innerHTML = obsTable;

		if (document.getElementById('city').children.length === 0) {
			const cityOptions = observations
				.map(obs => '<option value="#">#</option>'.replace(/#/g, obs.location))
				.join('');

			document.getElementById('city').innerHTML = cityOptions;
		}
		clearTimeout(updateObservations);
		setTimeout(updateObservations, 60 * 1000);
	});
};

const submitData = () => {
	const city = document.getElementById('city').value;
	const temp = document.getElementById('temperature').value;
	makeRequest('/observations/' + city + '/' + temp, 'POST', data => {
		console.log(data);
		if (data !== 'ok') {
			alert('Error while submitting data: ' + data);
		} else {
			updateObservations();
		}
	});
};

updateObservations();