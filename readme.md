# (inc clojure-brush)

**V0.9.1**

This is a smarter Clojure brush for [Syntax Highlighter](https://github.com/alexgorbatchev/SyntaxHighlighter) that goes further than existing efforts such as [sh-clojure](https://github.com/sattvik/sh-clojure). This brush is aware of S-Expression forms in clojure and provide sensible highlighting rules for core forms, and supports special rules for common core forms. 

You can see this running [here](http://brehaut.net/blog/2011/l_systems) and [here](http://brehaut.net/blog/2011/ring_introduction).

## Installation

Just install `shClojureBrush.js` as you would any other brush for syntax highlighter. If you also include `shClojureExtra.css` you will have the additional CSS rules for metadata, quotes and unmatched closing tokens.

## Improvements over sh-clojure

 * Full tokenizer and parser allow for structure aware highlighting:
    * `comment …` and `#_` forms are correctly highlighted.
    * Doesn't need to use a list of `clojure.core` symbols; can infer meaning from position in a form.
    * Differentiates between #{functions, macros}, #{methods and constructors}.
    * Knows about name binding forms such as let, binding, for, etc
       * Tracks locals and highlights them separately
    * Handles metadata and quoted forms
       * Styling is supported with appropriate CSS.    
    * Detects malformed code
       * Limited to incorrectly closed aggregate expressions currently
 * Performance is equal to or faster than `sh-clojure` despite doing more. For larger files it appears that the overhead of analyzing the code is surpassed by creation of HTML elements which exists outside the control of the brush.
 * Characters (including \newline, \tab, and \space) handled correctly.
 * Supports radix's, and ratios in number literals.

## Todo 
 
 * Tokenizer for Constructor literals.
 * Improved error handling
 * Expose registering custom form annotation rules.
 * Support configuration for coloring locals.
 * Exponents in number literals, hex literals

## Thanks

The following people supplied feedback, opinion, and critique during the development of this lib.

 * Alan Malloy
 * Chas Emerick
 * Oliver Hunt 
 * Steven Ashley

 * [Daniel Solano Gómez](http://www.deepbluelambda.org/) for his original Clojure Brush.
 
## License

Copyright (C) 2011 Andrew Brehaut

Distributed under the Eclipse Public License, the same as Clojure.