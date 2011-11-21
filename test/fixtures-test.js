var vows = require('vows');
var assert = require('assert');
var fs = require('fs');
var markdown_papers = require('./../lib/markdown-papers');

var files = fs.readdirSync(__dirname);

var batch_map = {};
files.forEach(function(file) {
    if (!file.match(/.md$/)) {
        return ;
    } 
    var reference_file = file.substr(0, file.length - 3) + '.html';
    batch_map[file] = {
        topic: function () {
            var markdown_content = fs.readFileSync(__dirname + '/' + file).toString();
            return markdown_papers.convertMarkdownToHtml(markdown_content, this.callback);
        },

        'formatted properly': function (error, converted_content) {
            var expected_content = fs.readFileSync(__dirname + '/' + reference_file).toString().trim();
            assert.equal (expected_content, converted_content);
            assert.equal (expected_content, converted_content, reference_file + ' is not the expected output of ' + file);
        }
    }
});
vows.describe('Fixure files').addBatch(batch_map).export(module);
