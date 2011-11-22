var jsdom = require("jsdom");
var markdown = require("markdown").markdown;

var MarkdownPaper = function(plain_text) {
    this.plain_text = plain_text;
};

MarkdownPaper.prototype.render = function(cb) {
    var html = markdown.toHTML(this.plain_text);

    /*
     * Extract h1 and everything until the first h2 and surround it with
     * a div.title_page. Before the first h2 insert an empty
     * div.table_of_contents
     */
    html = html.replace(/<h1>([\s\S.]+)<\/h1>[\s]+([\s\S.]*?)[\s]+<h2>/gi, '<div class="title_page">' + "\n\n" + '<h1>$1</h1>' + "\n\n" + '$2</div><div class="table_of_contents"></div>' + "\n\n" + '<h2>');

    /*
     * Everything between the closing h1 tag and the first h-tag is the
     * authors section, so surround that with div.author.
     */
    html = html.replace(/<\/h1>[\s]+([\s\S.]*?)[\s]+<h/gi, '</h1>' + "\n\n" + '<div class="author">$1</div><h');

    /*
     * Put a simple html5 doctype around everything. And add the screen.css.
     */
    html = '<!DOCTYPE html><html><head><meta charset="utf-8"><link href="screen.css" media="all" rel="stylesheet" type="text/css" /></head><body>' + html + '</body></html>'; 

    var jquery = 'http://code.jquery.com/jquery-1.6.4.min.js';

    jsdom.env({
        html: html,
        scripts: [
            jquery
        ],
        done: function(errors, window) {
            var $ = window.$;
            
            /*
             * Every h3 section is surrounded with a div.details for
             * easier blocking. The broken &lt;/div&gt; before the
             * first h3 is removed indirectly by jquery - so don't
             * worry :). 
             */
            var title_page_content = $('.title_page').html();
            title_page_content = title_page_content.replace(/<h3>/g, '</div><div class="details"><h3>');
            $('.title_page').html(title_page_content);

            /*
             * Every header on the title page (except the Abstract)
             * should get a colon afterwards. Abstract gets a dot.
             */
            $('.title_page h3').each(function(pos, element) {
                if ($(element).text() === 'Abstract') {
                    $(element).text('Abstract.');
                } else {
                    $(element).text($(element).text() + ':');
                }
            });

            
            /*
             * Build the table of contents and preceed every h2 with a
             * number to indicate the position of the section.
             */ 
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

            /*
             * Finally deliver the final dom element. Ugly fix, because I am
             * not sure how one can get the entire document + doctype from
             * jquery.
             */
            var result_html = '<!DOCTYPE html><html>' + $('html').html() + '</html>';

            /*
             * If second parameter is given, write it to file. Otherwise
             * output it.
             */
            cb(false, result_html);
        }
    });
};


exports.convertMarkdownToHtml = function(markdown_text, cb) {
    var paper = new MarkdownPaper(markdown_text);
    paper.render(cb);    
};
