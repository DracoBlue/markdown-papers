var jsdom = require("jsdom");
var markdown = require("markdown").markdown;

var MarkdownPaper = function(plain_text) {
    this.plain_text = plain_text;
};

MarkdownPaper.prototype.render = function(cb) {
    var that = this;
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

    this.createJsdomEnvFromHtml(html, function(window) {
        that.instrumentTitlePageIntoEnv(window, function() {
            that.instrumentTableOfContentsIntoEnv(window, function() {
                var $ = window.$;
                /*
                 * Remove the automaticly injected jquery-tag from #createJsdomEnvFromHtml.
                 * FIXME: this actually removes ALL of them, could be done better.
                 */
                $('script').remove();
                var result_html = '<!DOCTYPE html><html>' + $('html').html() + '</html>';
                cb(false, result_html);
            });
        });
    });
};

MarkdownPaper.prototype.createJsdomEnvFromHtml = function(html, cb) {
    jsdom.env({
        html: html,
        scripts: [
            'http://code.jquery.com/jquery-1.6.4.min.js'
        ],
        done: function(errors, window) {
            cb(window);
        }
    });
};

MarkdownPaper.prototype.instrumentTitlePageIntoEnv = function(window, cb) {
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
    
    cb();
};
    
MarkdownPaper.prototype.instrumentTableOfContentsIntoEnv = function(window, cb) {
    var that = this;
    var $ = window.$;
    /*
     * Build the table of contents and preceed every h2 with a
     * number to indicate the position of the section.
     */ 
    var toc_elements = [];

    var last_pos_for_level = [];

    $('body').children('*').each(function(pos, element) {
        var html_header_level = that.getHeaderLevelFromElement(element); 
        if (html_header_level < 1) {
            return ;
        }

        var header_level = html_header_level - 2;

        last_pos_for_level[header_level] = (last_pos_for_level[header_level] || 0) + 1;

        var numbers = [];
        
        for (var i = 0; i <= header_level; i++) {
            numbers.push(last_pos_for_level[i]);
        }

        var toc_element = numbers.join('.') + '. ' + $(element).text();
        $(element).text(toc_element);
        toc_elements.push(toc_element);
    });
    
    $('.table_of_contents').append($('<h2>Table of Contents</h2>'));
    
    var ul_element = $('<ul />');
    $.each(toc_elements, function(pos, toc_element) {
        ul_element.append($('<li />').text(toc_element));
    });
    
    $('.table_of_contents').append(ul_element);

    cb();
};

MarkdownPaper.prototype.getHeaderLevelFromElement = function(dom_element) {
    var matches = /^h(\d)/.exec(dom_element.tagName.toLowerCase()); 
    if (!matches) {
        return null;
    }

    return parseInt(matches[1], 10);
};

exports.convertMarkdownToHtml = function(markdown_text, cb) {
    var paper = new MarkdownPaper(markdown_text);
    paper.render(cb);    
};
