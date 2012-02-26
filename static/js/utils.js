var utils = {};

utils.monitor_url_hash = function(callback){
	var prev_hash = utils.get_friendly_url_hash().toString();
	var check_hash = function(){
		var current_hash = utils.get_friendly_url_hash();
		if(current_hash != prev_hash){
			prev_hash = current_hash.toString();
			callback(current_hash);
		}   
	}   
	setInterval(check_hash, 100);
};  

utils.get_friendly_url_hash = function(){
	var hash_re = new RegExp('^#/(.*?)/?$');
	var raw_hash = window.location.hash;
	if(raw_hash.length != 0){ 
		var re_match = raw_hash.match(hash_re);
		if(re_match != null && re_match.length > 1){ 
			var result = re_match[1].split('/');
			if(result[0].length == ''){
				return [];
			}else{
				return result;
			}
		}   
	}   
	return []; 
};

utils.plotable_list = function(start_list){
	var output = [];
	for(var i = 0, l = start_list.length; i < l; i++){
		output.push([l-i, start_list[i]]);
	}
	return output;
};

