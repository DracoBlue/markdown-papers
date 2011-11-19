#!/usr/local/bin/node

var fs = require("fs");
var sys = require("sys");
var jsdom = require("jsdom");
var markdown = require("markdown").markdown;
var file_name = process.argv[2];
var target_file_name = process.argv[3];


var html = markdown.toHTML(fs.readFileSync(file_name).toString());

html = html.replace(/<h1>([\s\S.]+)<\/h1>[\s]+([\s\S.]*?)[\s]+<h2>/gi, '<div class="title_page">' + "\n\n" + '<h1>$1</h1>' + "\n\n" + '$2</div><div class="table_of_contents"></div>' + "\n\n" + '<h2>');
html = html.replace(/<\/h1>[\s]+([\s\S.]*?)[\s]+<h3>/gi, '</h1>' + "\n\n" + '<div class="author">$1</div><h3>');


html = '<!DOCTYPE html><html><head><meta charset="utf-8"><link href="screen.css" media="screen" rel="stylesheet" type="text/css" /></head><body>' + html + '</body></html>'; 

var jquery = 'http://code.jquery.com/jquery-1.6.4.min.js';

jsdom.env({
    html: html,
    scripts: [
        jquery
    ],
    done: function(errors, window) {
        var $ = window.$;
        
        var title_page_content = $('.title_page').html();
        
        title_page_content = title_page_content.replace(/<h3>/g, '</div><div class="details"><h3>');
        $('.title_page').html(title_page_content);

        $('.title_page h3').each(function(pos, element) {
            if ($(element).text() === 'Abstract') {
                $(element).text('Abstract.');
            } else {
                $(element).text($(element).text() + ':');
            }
        });

        
        var toc_elements = [];
        
        $('h2').each(function(pos, element) {
            var toc_element = (toc_elements.length + 1) + '. ' + $(element).text();
            $(element).text(toc_element);
            toc_elements.push(toc_element);
        });
        
        $('.table_of_contents').append($('<h2>Table of Contents</h2>'));
        
        var ul_element = $('<ul />');
        $.each(toc_elements, function(pos, toc_element) {
            ul_element.append($('<li />').text(toc_element));
        });
        
        $('.table_of_contents').append(ul_element);
        
        var result_html = '<!DOCTYPE html><html>' + $('html').html() + '</html>';

        if (target_file_name) {
            fs.writeFileSync(target_file_name, result_html, 'utf-8');
        } else {
            sys.puts(result_html);
        }
    }
});
