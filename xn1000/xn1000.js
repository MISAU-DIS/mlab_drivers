#!/usr/bin/env node

"use strict"

var net = require('net');
var path = require("path");
var settings = require(path.resolve(".", "config", "settings.json"));
var mapping = require(path.resolve(".", "config", "xnseries.json"));
var client = require('node-rest-client').Client;
var line = "";


var line = "";
var cur_pos;
var urls = [];

var options_auth = {
		user: settings.lisUser,
		password: settings.lisPassword
	};

function sendData(urls){
		var url = encodeURI(urls[0].replace("+", "---"));
		url = url.replace("---", "%2B");
		urls.shift();
		(new client(options_auth)).get(url, function (data) {
			console.log("url sent:", url);
			
			if(urls.length > 0){
				sendData(urls);
			}
    });
}

function getResult(l, f){
	var bare_f = f.replace(".", "");
	var block = l.substr(cur_pos, (bare_f.length + 1));
	var block_val = l.substr(cur_pos, f.length);
	cur_pos += bare_f.length + 1;

	var signs = {
			"0": "",
			"1": "+",
			"2": "-",
			"4": "*"
		};

	var sign = signs[block.substr((block.length - 1), 1)];
	var value = "";
	if (f.match(/\./)){

		var left = f.split(/\./)[0].length;
		var right = f.split(/\./)[1].length;

		value = parseFloat(block_val.substr(0, left) + "." + block_val.substr(left, right));
	}else{
		value = parseInt(block_val);
	}

	if (String(sign).match(/\+|\-|\*/)){value = value + " " + sign}
	return value;
}

var server = net.createServer(function(socket) {

	socket.setNoDelay(true);
	socket.on('data', function(data) {

			var line = String(data);
			line = line.replace(/^\x02/, "");
			line = line.replace(/\x03$/, "");
			console.log(line);

			if (line.match(/^D1U/)){
				return;
			}

			if (line.match(/^R1000/)){
				//Send Response
				//console.log(data);
				//console.log("IP:: " + socket.remoteAddress);
				//console.log("Port:: " + socket.remotePort);

				//socket.write("STX");
				//socket.write("ETX");
				//socket.write("EOT");
				//socket.write(new Buffer([2]));
				return;
			}

			urls = [];
			var specimen_id = line.substr(44, 10);
			console.log(specimen_id);
			cur_pos = (44 + 10); //10 for length of specimen id

			var format = [
				["WBC", "***.**"],
				['RBC', '**.**'],
				['HGB', '***.*'],
				['HCT', '***.*'],
				['MCV', '***.*'],
				['MCH', '***.*'],
				['MCHC', '***.*'],
				['PLT', '****'],
				['LYMPH%', '***.*'],
				['MONO%', '***.*'],
				['NEUT%', '***.*'],
				['EO%', '***.*'],
				['BASO%', '***.*'],
				['LYMPH#', '***.**'],
				['MONO#', '***.**'],
				['NEUT#', '***.**'],
				['EO#', '***.**'],
				['BASO#', '***.**'],
				['RDW-CV', '***.*'],
				['RDW-SD', '***.*'],
				['PDW', '***.*'],
				['MPV', '***.*'],
				['P-LCR', '***.*'],
				['RET%', '**.**'],
				['RET#', '.****'],
				['IRF', '***.*'],
				['LFR', '***.*'],
				['MFR', '***.*'],
				['HFR', '***.*'],
				['PCT', '**.**'],
				['NRBC%', '****.*'],
				['NRBC#', '***.**'],
				['IG#', '***.**'],
				['IG%', '***.*'],
				['blank', '*****'],
				['RET-He', '***.*']
			]


		var link = settings.lisPath;
		link = link.replace(/\#\{SPECIMEN_ID\}/, specimen_id);

		for(var i = 0; i < format.length; i++){

			var parameter = format[i][0].toUpperCase().trim();
			var result = getResult(line, format[i][1]);
			console.log(format[i][0] + "   : " + result);

			var measure_id = mapping[parameter];

			var uri = link.replace(/\#\{MEASURE_ID\}/, measure_id);
			uri = uri.replace(/\#\{RESULT\}/, result);
			if(measure_id != undefined){
				urls.push(uri);
			}
		}

		console.log("Sending Data to Server")

		sendData(urls);
		urls = [];
		line = "";
	});
});

server.listen(settings.driverPort, settings.driverHost, ()=>{
	console.log("Server is listening on " + settings.driverHost + ":" + settings.driverPort);
});
