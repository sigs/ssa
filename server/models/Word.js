
/**
 * Mongoose Schema for dictionary entry (Word)
 */
var mongoose = require('mongoose')
var wordSchema = mongoose.Schema({
	word: String,
	index: Number,
	explanation: String,
	sources: String
})
module.exports = mongoose.model('Word', wordSchema)
