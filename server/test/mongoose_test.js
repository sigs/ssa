var Q = require('q')
var writeQ = Q.defer()
var readQ = Q.defer()

var chai = require('chai') 
var expect = chai.expect
chai.use(require('chai-as-promised'))

describe('mongo, if properly installed', function () {
	it('should write stuff', function (done) {		
		var mongoose = require('mongoose')
		var db = mongoose.connection
		db.on('error', function (error) { throw new Error(error) })
		db.once('open', function (err) {
			if (!!err) { throw new Error(err) }			
			var Word = require('../models/Word.js')
			Word.remove({ word: "Testi" }).exec()			
			Word.create({
				word: "Testi",
				index: 1,
				explanation: "Testailu",
				sources: "Testilähde"
			}, function () {
				done()
			})
		})
		mongoose.connect('mongodb://localhost/test')
	})
})

