var mysql = require('mysql');
module.exports = {
    getAllData: function(afterLoad) {
        // Query initial data from the database
        con.query('select location, temperature, time from weather.observations;', function (err, result) {
            if (err) throw err;
            afterLoad(result);
        });
    },
    connect: function() {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
        });
    },
    saveObservation: function(observation) {
        con.query('insert into weather.observations (location, temperature, time) values (?)',
            [[observation.location, observation.temperature, observation.time]]);
    }
};

var con = mysql.createConnection({
	host: "localhost",
	user: "root"
  });
  