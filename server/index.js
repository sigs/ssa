var mongoose = require('mongoose');
var express = require('express');

var app = express();

app.get('/', function (req, res) {
	res.send('SSA!')
})

var server = app.listen(8080, function () {
	var url = server.address()
	console.dir(url)
  	console.log('SSA running at http://%s:%s', url.host, url.port);
})
