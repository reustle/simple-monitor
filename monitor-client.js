'use strict';

var spawn_process = require('child_process').spawn;
var mongo = require('mongojs');
var async = require('async');
var fs = require('fs');

var app = {
	models : {},
	controllers : {}
};

app.init = function(){
	// Set up and start the app
	
	// Require a machine name
	if(process.argv.length < 3){
		console.log('Error: No machine name given\n' + 'Usage: node monitor-client.js serving1');
		return 0;
	}else{
		app.models.set_machine_name(process.argv[2]);
	}
	
	// Create the DB connection
	app.models.db_connect({
		host : '127.0.0.1',
		port : 27017,
		db_name : 'simple_monitor',
		stats_col_name : 'machine_stats',
		machines_col_name : 'machines'
	});
	
	// Verify this machine is known by the monitor
	app.models.verify_known_machine(function(){});
	
	// Run every 5 seconds, forever
	setInterval(function(){
		app.controllers.get_stats(app.models.send_status);
	}, 5 * 1000);
	
};

// MODELS

app.models.db_connect = function(db_config){
	// Connect to the given mongodb instance
	
	var mongo_connection_string = db_config.host + ':' + db_config.port + '/' + db_config.db_name;
	app.models.db_database_connection = mongo.connect(mongo_connection_string);
	app.models.db_stats_collection = app.models.db_database_connection.collection(db_config.stats_col_name);
	app.models.db_machines_collection = app.models.db_database_connection.collection(db_config.machines_col_name);
	
};

app.models.set_machine_name = function(new_machine_name){
	// Set the machine name
	
	app.models.machine_name = new_machine_name.toLowerCase();
};

app.models.get_cpu_util = function(callback){
	// Return the CPU utilization
	
	var iostat_proc = spawn_process('iostat', ['-c']);
	iostat_proc.stdin.end();
	iostat_proc.stdout.on('data', function(proc_output){
		
		proc_output = proc_output.toString();
		
		// TODO make this smarter
	//	console.log(proc_output.split('/n')[1].split('/n'));
		
		callback(null, Math.random());
	});
};

app.models.get_load_avg = function(callback){
	// Return the average load
	
	fs.readFile('/proc/loadavg', 'utf8', function(err, file_content){
		if(err){ throw err }
		
		file_content = file_content.split(' ');
		
		callback(null, {
			_1m : parseFloat(file_content[0]),
			_5m : parseFloat(file_content[1]),
			_15m : parseFloat(file_content[2]),
		});
		
	});
	
};

app.models.get_disk = function(callback){
	// Return the disk usage
	
	callback(null, 'disk_result');
};

app.models.get_memory = function(callback){
	// Return the % memory used
	
	fs.readFile('/proc/meminfo', 'utf8', function(err, file_content){
		if(err){ throw err }
		
		var lines = file_content.split('\n');
		
		var memory_regex = /.*\s\s(\d+)\s\w+$/;
		
		var total_memory = lines[0].match(memory_regex)[1];
		var free_memory = lines[1].match(memory_regex)[1];
		
		var percent_free = parseInt(free_memory, 10) / parseInt(total_memory, 10);
		
		var percent_used = 1 - percent_free;
		
		callback(null, percent_used);
	});
};

app.models.send_status = function(stats_data, callback){
	// Send the status to the monitor db
	
	callback = callback || function(){};
	
	var insert_row = {
		machine : app.models.machine_name,
		time : new Date(),
		stats : stats_data
	};
	
	// debug
	console.log('Insert: ' + JSON.stringify(insert_row));
	
	app.models.db_stats_collection.insert(insert_row, function(){
		callback();
	});
};

app.models.verify_known_machine = function(callback){
	var insert_row = {
		name : app.models.machine_name
	};
	
	var machines_check = app.models.db_machines_collection.find({name: app.models.machine_name}, function(err, response){
		if(!response.length){
			app.models.db_machines_collection.insert(insert_row, function(){
				callback();
			});
		}
	});
	
};

// CONTROLLERS

app.controllers.get_stats = function(callback){
	// Request all the stats
	
	async.parallel({
		cpu_util : function(callback){
			app.models.get_cpu_util(callback);
		},
		load_avg : function(callback){
			app.models.get_load_avg(callback);
		},
		memory : function(callback){
			app.models.get_memory(callback);
		},
		disk : function(callback){
			app.models.get_disk(callback);
		}
	}, function(err, results){
		if(err){ throw err }
		
		callback(results);
	});
};

// INIT
app.init();

