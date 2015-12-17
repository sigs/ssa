#!/usr/bin/env node
// Parse HTML from "textutil -convert html derp.rtf" into mongoDB using mongoose.js

/*global process */

// async de-inversion of control
var Q = require('q')
var stdinQ = Q.defer()
var mongoQ = Q.defer()
var lastWriteDoneQ = Q.defer();

// DB schema
var Word = require('../models/Word.js')

// read raw HTML from stdin
var cheerio = require('cheerio')
var inputChunks = []
process.stdin.setEncoding('utf8')
process.stdin.on('data', function(chunk) {
	inputChunks.push(chunk)
});
process.stdin.on('end', stdinQ.resolve)

// open db connection
var mongoose = require('mongoose')
// options from http://blog.mongolab.com/2014/04/mongodb-driver-mongoose/
//var mongooseOptions = { server: { socketOptions: { keepAlive: 1, connectTimeoutMS: 30000 } }, 
//              		  replset: { socketOptions: { keepAlive: 1, connectTimeoutMS : 30000 } } }
mongoose.connect('mongodb://localhost/ssa')//, mongooseOptions)
var db = mongoose.connection
db.on('error', function (error) { console.log("Error: " + error) })
db.once('open', mongoQ.resolve)
 
// when both done, stuff results into mongoDB
Q.all([stdinQ.promise, mongoQ.promise]).then(function () {
	//return parse(inputChunks.join(""), writeToConsole)
	return parse(inputChunks.join(""), writeToDB)
}).then(function () {
	db.close()
})

/**
 * Parse HTML output from "textutil -convert html derp.rtf" 
 * @param {Object} htmlString to parse
 * @param {Object} write callback function where results are passed 
 * @return {Promise} when all writes are done
 */
function parse(htmlString, write) {
	$ = cheerio.load(htmlString)
	
	// clean up
	$('.Apple-tab-span').remove()
	
	// promises from each write action separately 
	var writeQ = [] 
	
	var definitionStyle, sourceStyle
	var definition = '',
		source = '',
		title = '';		
	$('p').each(function (i, p) {
		var $p = $(p)
		var style = $p.attr('class')
		var content = $p.html()
		var $title = $p.find('b')		
		if (!!$title.text()) {
			if (!definitionStyle) { definitionStyle = style }
			// write previous
			if (!!definition) {
				writeQ.push(write(title, definition, source))
				definition = source = title = ''
			}
						
			title = $title.text();
			definition += content;			
		} else if (style === definitionStyle) {
			// keep adding after the first def line that had title
			definition += content
		} else {
			// empty line separates definition from sources
			if (!!$p.text().trim()) {
				if (!sourceStyle) { sourceStyle = style }
				source += content
			}
		}
	});	
	
	if (!!definition) {
		writeQ.push(write(title, definition, source))
	}	
	return Q.all(writeQ);
}

function writeToConsole(key, value, value2) {
	var index = writeToConsole.synonymCount[key] || 0;
	writeToConsole.synonymCount[key] = index + 1;

	if (!index) {
		console.log(key + ": " + value + " / " + value2)
	} else {
		console.log(key + "(" + (index + 1) + "): " + value + " / " + value2)
	}
	return Q(true)
}
writeToConsole.synonymCount = {}

function writeToDB(key, value, value2) {
	// filter out pre-parsing artifacts such as "ladi,"
	key = key.replace(',', '')
	
	var index = writeToDB.synonymCount[key] || 0;
	writeToDB.synonymCount[key] = index + 1;

	var entry = new Word({
		word: key,
		index: index,
		explanation: value,
		sources: value2
	})
	return entry.save(function (err, item) {
		if (!!err) {
			console.log("Error: " + err)
		} else {
			console.log("Wrote " + key)
			//console.dir(item)
		}
	})	
}
writeToDB.synonymCount = {}
