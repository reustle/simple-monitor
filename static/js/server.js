'use strict';

var http = require('http');
var async = require('async');
var mongo = require('mongojs');
var _ = require('underscore');

var db_simple_monitor = mongo.connect('127.0.0.1:27017/simple-monitor');
var db_machines = db_simple_monitor.collection('machines');
var db_machine_stats = db_simple_monitor.collection('machine_stats');

http.createServer(function(req, res){
	
	if(req.url == '/favicon.ico'){
		res.writeHead(404, {'Content-Type' : 'text/html'});
		res.end('wat\n');
		return;
	}
	
	console.log('[' + (new Date()) + '] ' + req.url);
	
	var friendly_url = req.url.split('/');
	friendly_url.shift();
	
	if(friendly_url[0] == 'machines'){
		// Load the list of machines
		
		res.writeHead(200, {'Content-Type' : 'application/javascript'});
		var output = [];
		
		db_machines.find().sort({name:1}, function(err, machines){
			if(err){ throw err }
			
			var get_current_stats = function(machine, callback){
				db_machine_stats.find({machine:machine.name}).limit(1).sort({time:-1}, function(err, latest_stat){
					if(err){ throw err }
					
					if(latest_stat[0]){
						output.push(latest_stat[0]);
					}
					
					callback();
				});
			};
			
			async.forEach(machines, get_current_stats, function(err){
				if(err){ throw err }
				
				// Sort output by machine name
				res.end(JSON.stringify(output));
				
			});
			
		});
		
	}else if(friendly_url[0] == 'machine'){
		// Load a specific machine
		
		if(friendly_url.length == 1){
			res.writeHead(404, {'Content-Type' : 'text/html'});
			res.end('wat\n');
		}
		
		res.writeHead(200, {'Content-Type' : 'application/javascript'});
		
		db_machine_stats.find({machine:friendly_url[1]}).limit(20).sort({time:-1}, function(err, latest_stats){
			if(err){ throw err }
			
			var all_stats = {
				cpu : [],
				memory : [],
				disk : [],
				processes : [0,0]
			};
			
			for(var i = 0, l = latest_stats.length; i < l; i++){
				all_stats.cpu.push(latest_stats[i].stats.cpu);
				all_stats.memory.push(latest_stats[i].stats.memory);
				all_stats.disk.push(latest_stats[i].stats.disk);
				all_stats.processes = latest_stats[i].stats.processes;
			}
			
			res.end(JSON.stringify({
				machine : friendly_url[1],
				stats : all_stats
			}));
			
		});
		
		var output = {
			name : friendly_url[1],
			stats : {
				cpu : [
					0.79, 0.77, 0.48, 0.44,
					0.41, 0.58, 0.48, 0.34,
					0.48, 0.47, 0.43, 0.53,
					0.59, 0.43, 0.46, 0.45,
					0.32, 0.32, 0.34, 0.44
				],
				memory : [
					0.32, 0.32, 0.34, 0.44
				],
				disk : [
					0.50, 0.49, 0.49, 0.48
				],
				processes : [
					['p_processing_pipeline_1m.py', true],
					['p_processing_pipeline_1h.py', true],
					['p_processing_pipeline_1d.py', false],
					['p_processing_pipeline_vertical.py', true]
				]
			}
		};

		
	}else{
		res.writeHead(404, {'Content-Type' : 'text/html'});
		res.end('wat\n');
	}
	
}).listen(6543, '127.0.0.1');

console.log('[' + (new Date()) + '] Running. Waiting for requests.');

