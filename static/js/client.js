'use strict';

var app = {};
	
app.init = function(){
	
	// Route the initial request
	app.route(utils.get_friendly_url_hash());
	
	// Route the request if the url changes
	utils.monitor_url_hash(app.route);
	
};

app.route = function(req){
	
	// Kill any refresh timer
	clearTimeout(app.refresh_timer);
	
	if(req.length == 0){
		//#/
		app.controllers.show_index();
		
	}else if(req.length == 2 && req[0] == 'view'){
		//#/view/machine-name/
		app.controllers.show_machine(req[1]);
		
	}
	
};

app.consts = {
	warning_threshold : 0.75
};

/* #################### */
app.models = {};

app.models.tmp_machines = [
	{
		machine : 'process1',
		stats : {
			cpu : Math.random(0, 1),
			memory : Math.random(0, 1),
			disk : Math.random(0, 1),
			processes : [10, 10]
		}
	},{
		machine : 'process2',
		stats : {
			cpu : Math.random(0, 1),
			memory : Math.random(0, 1),
			disk : Math.random(0, 1),
			processes : [6, 6]
		}
	},{
		machine : 'serve1_temp',
		stats : {
			cpu : Math.random(0, 1),
			memory : Math.random(0, 1),
			disk : Math.random(0, 1),
			
			processes : [14, 15]
		}
	}
];

app.models.tmp_machine = {
	machine : 'process2',
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

app.models.load_machines = function(callback){
	//callback(_.clone(app.models.tmp_machines));
	$.getJSON('/monitor/json/machines/', callback);
};

app.models.load_machine = function(machine_name, callback){
	//callback(_.clone(app.models.tmp_machine));
	$.getJSON('/monitor/json/machine/' + machine_name + '/', callback);
};

/* #################### */
app.controllers = {};

app.controllers.show_index = function(){
	
	app.models.load_machines(function(machines){
		
		// Add warn flags if a value is above the threshold 
		for(var i = 0, l = machines.length; i < l; i++){
			if(machines[i].stats.cpu > app.consts.warning_threshold){
				machines[i].stats.warn_cpu = true;
			}
			
			if(machines[i].stats.memory > app.consts.warning_threshold){
				machines[i].stats.warn_memory = true;
			}
			
			if(machines[i].stats.disk > app.consts.warning_threshold){
				machines[i].stats.warn_disk = true;
			}
		}
		
		app.views.render_index({
			machines : machines
		});
	});
	
	app.refresh_timer = setTimeout(app.controllers.show_index, 15*1000);
	
};

app.controllers.show_machine = function(machine_name){
	
	app.models.load_machine(machine_name, function(machine_stats){
		app.views.render_machine(machine_stats);
	});
	
};

/* #################### */
app.views = {};

app.views.render_index = function(data){
	var tmpl = "\
		<h1>All Machines</h1>\
		<table class='index'>\
			<tr>\
				<th>Machine</th>\
				<th>CPU</th>\
				<th>Memory</th>\
				<th>Disk</th>\
				<th>Processes</th>\
			</tr>\
			{{#machines}}\
				<tr onclick='window.location = \"#/view/{{machine}}/\"'>\
					<td><a href='#/view/{{machine}}/'>{{machine}}</td>\
					{{#stats}}\
						<td><div class='progress_bar'><div {{#warn_cpu}}class='warn'{{/warn_cpu}} style='width: {{cpu}}px'></div></div></td>\
						<td><div class='progress_bar'><div {{#warn_memory}}class='warn'{{/warn_memory}} style='width: {{memory}}px'></div></div></td>\
						<td><div class='progress_bar'><div {{#warn_disk}}class='warn'{{/warn_disk}} style='width: {{disk}}px'></div></div></td>\
						<td>{{processes}}</td>\
					{{/stats}}\
				</tr>\
			{{/machines}}\
		</table>\
	";
	
	// Prep stats
	for(var i = 0; i < data.machines.length; i++){
		data.machines[i].stats.cpu = parseInt(data.machines[i].stats.cpu * 100, 10);
		data.machines[i].stats.memory = parseInt(data.machines[i].stats.memory * 100, 10);
		data.machines[i].stats.disk = parseInt(data.machines[i].stats.disk * 100, 10);
		data.machines[i].stats.processes = data.machines[i].stats.processes[0] + '/' + data.machines[i].stats.processes[1];
	}
	
	$('#body').html(Mustache.to_html(tmpl, data));		
	
};

app.views.render_machine = function(data){
	var tmpl = "\
		<h1>{{machine}}</h1>\
		<a href='#/'>Back</a>\
		<h2>CPU Usage</h2>\
		<div id='graph_cpu' class='graph'></div>\
		<h2>Memory Usage</h2>\
		<div id='graph_memory' class='graph'></div>\
		<h2>Disk Usage</h2>\
		<div id='graph_disk' class='graph'></div>\
	";
	
	$('#body').html(Mustache.to_html(tmpl, data));
	
	var graph_options = {
		yaxis : {
			min : 0,
			max : 1,
			ticks : [
				[0.25, '25%'],
				[0.5, '50%'],
				[0.75, '75%'],
				[1, '100%']
			]
		},
		xaxis : {
			ticks : [
				[20, 'Now'],
				[16, '1 min'],
				[12, '2 min'],
				[8, '3 min'],
				[4, '4 min'],
				[1, '5 min']
			]
		}
	};
	
	var line_options = {
		color : '#c00',
		threshold : {
			below : app.consts.warning_threshold,
			color : '#2d2',
		}
	};
	
	// CPU Graph
	var cpu_points = utils.plotable_list(data.stats.cpu);
	$.plot($('#graph_cpu'), [ _.extend(line_options, {data : cpu_points}) ], graph_options);
	
	// Memory Graph
	var memory_points = utils.plotable_list(data.stats.memory);
	$.plot($('#graph_memory'), [ _.extend(line_options, {data : memory_points}) ], graph_options);
	
	// Disk Graph
	var disk_points = utils.plotable_list(data.stats.disk);
	$.plot($('#graph_disk'), [ _.extend(line_options, {data : disk_points}) ], graph_options);
	
	// Process List
	
	
};

var script_path = 'static/js/';
$LAB
.script(script_path + 'jquery.js')
.script(script_path + 'jquery.flot.js')
.script(script_path + 'jquery.flot.threshold.js')
.script(script_path + 'mustache.js')
.script(script_path + 'underscore.js')
.script(script_path + 'utils.js').wait(function(){
	app.init();
});

