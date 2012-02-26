var last_update = new Date();
var mongo = require('mongojs');

var db_simple_monitor = mongo.connect('174.129.39.104:27017/simple-monitor');
var db_machine_stats = db_simple_monitor.collection('machine_stats');

setInterval(function(){
	var time_since = parseInt((new Date()) - last_update, 10);
	if(time_since < 15*1000){
		return 0;
	}
	console.log('time since: ' + time_since);
	
	last_update = new Date();
	
	db_machine_stats.insert({
		machine : process.argv[2],
		time : new Date(),
		stats : {
			cpu : Math.random(0, 1),
			memory : Math.random(0, 1),
			disk : Math.random(0, 1),
			processes : [10, 10]
		}
	}, function(){
		console.log('inserted');
	});
	
}, 500);

