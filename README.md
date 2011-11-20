# Markdown Papers 0.1

[@dracoblue] (http://github.com/dracoblue), [@rmetzler] (http://github.com/rmetzler)

### Abstract

The idea is to use a specific markdown file to write proper formatted papers and articles. It's still work in progress and only pre-alpha, but already looks quite nice.

### Keywords

markdown, javascript, llncs

## Example

You can use this `README.md` as source and generate a `.html` by using:

    $ bin/markdown-papers README.md README.html

The output should look like that:

![Example Output](https://github.com/DracoBlue/markdown-papers/raw/master/example.png)

## Pre-Conditions

You need [node.js] (http://nodejs.org),  [npm] (http://npmjs.org) and the [CMU Fonts] (http://cm-unicode.sourceforge.net/) installed.

## Installation

It's quite simple to test the current version.

Get your self a copy and configure it with npm:

    $ git clone git://github.com/DracoBlue/markdown-papers.git
    $ cd markdown-papers
    $ ./configure

Now, test it:

    $ bin/markdown-papers README.md README.html

and it will generate the README.md as a nicely formatted one.

## License

**markdown-papers** is available under the terms of MIT License.
