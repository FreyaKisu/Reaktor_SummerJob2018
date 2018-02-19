var mysql = require('mysql');
/*
For this to work you'll need to have mysql database running on localhost
with default username and password and there must be database "weather" with
the following table:
+-------------+-------------+------+-----+---------+-------+
| Field       | Type        | Null | Key | Default | Extra |
+-------------+-------------+------+-----+---------+-------+
| location    | varchar(50) | YES  |     | NULL    |       |
| temperature | double      | YES  |     | NULL    |       |
| time        | date        | YES  |     | NULL    |       |
+-------------+-------------+------+-----+---------+-------+
*/
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
  