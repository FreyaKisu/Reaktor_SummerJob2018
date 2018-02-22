var mysql = require('mysql');
/*
For this to work you'll need to have mysql database and
there must be database "weather" with the following table:
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
        con.query('select location, temperature, time from ta2tfzaazgdur2p4.observations;',
        function (err, result) {
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
        con.query('insert into ta2tfzaazgdur2p4.observations (location, temperature, time) values (?)',
            [[observation.location, observation.temperature, observation.time]]);
    }
};

var con = mysql.createConnection({
	host: "cvktne7b4wbj4ks1.chr7pe7iynqr.eu-west-1.rds.amazonaws.com",
    user: "exopczqb76226s1s",
    password: process.env.PASSWORD
  });
  
