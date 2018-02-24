//changing random bgimg
 
$(document).ready(function(){
    var classCycle=['bg1','bg2','bg3','bg4','bg5','bg6','bg7','bg8',
        'bg9','bg10','bg11','bg12','bg13','bg14','bg15','bg16','bg17'];
 
    var randomNumber = Math.floor(Math.random() * classCycle.length);
    var classToAdd = classCycle[randomNumber];
 
	$('.container-with-bgimg').addClass(classToAdd);
	
	//Geolocation
   
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            makeRequest("/location/LAT/LON".replace('LAT', lat).replace('LON', lon), "POST", data => {
                console.log("Server answered with data: ", data);
                if (!data.error) {
                    $('#city').val(data.location).change();
                    $('#localTemp').html('Current temperature <br/> in '+ data.location + ' is ' + data.temperature + '&#8451;');
                    $('#temperature').val(data.temperature);
                }
            });
        });
    }
   
});
 
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
            temperature: '&#8451;',
            min: 'Min.&#8451;',
            max: 'Max.&#8451;'
        };
        const obsTable = [titleRow].concat(observations).map(obs => {
            const div = content => '<div>'+ (content ? content : '---')+'</div>';
            return div(['location', 'temperature', 'min', 'max'].map(prop => obs[prop]).map(div).join(''));
        }).join('');
 
        document.getElementById('observations').innerHTML = obsTable;
 
        if (document.getElementById('city').children.length === 0) {
            observations.forEach(obs => $('#city').append(
                $('<option></option>').attr('value', obs.location).text(obs.location)
            ));
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