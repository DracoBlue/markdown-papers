var jsdom = require("jsdom");
var fs = require("fs");
var markdown = require("markdown").markdown;

var MarkdownPaper = function(plain_text) {
    this.plain_text = plain_text;
    this.template = 'default';

    this.content = '';
    this.blocks = {
        "Title": "",
        "Authors": "",
        "Abstract": "",
        "Keywords": ""
    };
};

MarkdownPaper.prototype.setTemplate = function(template_name) {
    this.template = template_name;
};

MarkdownPaper.prototype.render = function(cb) {
    var that = this;
    var html = markdown.toHTML(this.plain_text);

    this.blocks["Title"] = html.match(/<h1>([\s\S.]+)<\/h1>/)[1];

    /*
     * Everything between the closing h1 tag and the first h-tag is the
     * authors section, so surround that with div.author.
     */
    this.blocks["Authors"] = html.match(/<\/h1>[\s]+([\s\S.]*?)[\s]+<h/i)[1];
    
    /*
     * Remove <h1></h1>+authors to have it easier to parse the other blocks
     * (Keywords+abstract).
     */
    html = html.replace(/<h1>[\s\S.]+<\/h1>[\s]+([\s\S.]*?)[\s]+<h/i, '<h');

    /*
     * Everything until the first h2 is a block for the meta
     * information. So let's find all of them.
     */
    var meta_html = html.match(/([\s\S.]*?)<h2>/)[1];

    meta_html.split('<h3>').forEach(function(part) {
        part = part.trim();

        if (!part) {
            /*
             * Ok, empty section, so we are at the beginning!
             */
            return ;
        }

        part = '<h3>' + part;
        
        var meta_section_parts = part.match(/^<h3>([\s\S.]+?)<\/h3>([\s\S.]+)$/);
        var meta_title = meta_section_parts[1].trim();
        var meta_body = meta_section_parts[2].trim();
        that.blocks[meta_title] = meta_body;
    });

    /*
     * Everything after the first h2 is real content.
     */
    this.content = html.match(/(<h2>[\s\S.]+)$/)[1];

    this.loadHtmlFromTemplate(this.template, function(html) {
        that.createJsdomEnvFromHtml(html, function(window) {
            that.instrumentBlocksIntoEnv(window, function() {
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
    });
};


MarkdownPaper.prototype.loadHtmlFromTemplate = function(template_name, cb) {
    fs.readFile(__dirname + '/templates/' + template_name + '.html', function(error, template_content_buffer) {
        cb(template_content_buffer.toString());
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

MarkdownPaper.prototype.instrumentBlocksIntoEnv = function(window, cb) {
    var that = this;
    var $ = window.$;

    var removeHtmlForSection = function(key) {
        $('.js_' + key).remove();
    };

    var replaceHtmlForSection = function(key) {
        if ($('.js_content_' + key).length) {
            $('.js_content_' + key).html(that.blocks[key]);
        } else {
            $('.js_' + key).html(that.blocks[key]);
        }
    };

    /*
     * Every h3 section is surrounded with a div.details for
     * easier blocking. The broken &lt;/div&gt; before the
     * first h3 is removed indirectly by jquery - so don't
     * worry :). 
     */
    for (var key in this.blocks) {
        if (this.blocks.hasOwnProperty(key)) {
            if (this.blocks[key]) {
                replaceHtmlForSection(key);
            } else {
                /*
                 * It's empty, so let's get rid of it.
                 */
                removeHtmlForSection(key);
            }
        }
    }

    $('.contents').html(this.content);

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

    $('.contents').children('*').each(function(pos, element) {
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

        var toc_element = numbers.join('.') + ' ' + $(element).text();
        $(element).text(toc_element);
        toc_elements.push(toc_element);
    });
    
    var ul_element = $('.table_of_contents').find('ul');
    $.each(toc_elements, function(pos, toc_element) {
        ul_element.append($('<li />').text(toc_element));
    });
    
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
