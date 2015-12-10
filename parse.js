#!/usr/bin/env node

var cheerio = require('cheerio');

var inputChunks = []
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(chunk) {
	inputChunks.push(chunk)
});
process.stdin.on('end', function() {
	parse(inputChunks.join(""));
});

function parse(htmlString) {
	$ = cheerio.load(htmlString)
	
	// clean up
	$('.Apple-tab-span').remove()
	
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
				write(title, definition, source)
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
		write(title, definition, source)
	}	
}

var synonymCount = {}
function write(key, value, value2) {
	var index = synonymCount[key] || 0;
	synonymCount[key] = index + 1;

	if (!index) {
		console.log(key + ": " + value + " / " + value2)
	} else {
		console.log(key + "(" + (index+1) + "): " + value + " / " + value2)
	}
}
