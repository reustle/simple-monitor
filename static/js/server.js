'use strict';

var http = require('http');

http.createServer(function(req, res){
	
	console.log('hit\n');
	res.writeHead(200, {'Content-Type' : 'text/plain'});
	res.end('Foo Bar\n');
	
}).listen(1337, '127.0.0.1');

console.log('listening');

