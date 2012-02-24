'use strict';

var http = require('http');
var mongo = require('mongojs');

var config_db = mongo.connect('127.0.0.1:27017/simple-monitor');
var machines = config_db.collection('machines');
var machine_stats = config_db.collection('machine_stats');

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

		output.push({
			name : 'foo',
			stats : {
				cpu : 0.57,
				memory : 0.43,
				disk : 0.11,
				processes : [10, 10]
			}
		});

		res.end(JSON.stringify(output));
		
	}else if(friendly_url[0] == 'machine'){
		// Load a specific machine
		
		if(friendly_url.length == 1){
			res.writeHead(404, {'Content-Type' : 'text/html'});
			res.end('wat\n');
		}
		
		res.writeHead(200, {'Content-Type' : 'application/javascript'});
		
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

		res.end(JSON.stringify(output));
		
	}else{
		res.writeHead(404, {'Content-Type' : 'text/html'});
		res.end('wat\n');
	}
	
}).listen(6543, '127.0.0.1');

console.log('listening');

