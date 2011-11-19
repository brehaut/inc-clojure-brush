# (inc clojure-brush)

## ;; Work In Progress

This project aims to product a smarter clojure brush for [Syntax Highlighter](https://github.com/alexgorbatchev/SyntaxHighlighter) that goes further than existing efforts such as [sh-clojure](https://github.com/sattvik/sh-clojure). This brush attempts to be moderately aware of S-Expression forms in clojure and provide sensible highlighting rules for core forms, and hopefully guess sensibly for additional forms. 

In addition to correctness, this brush attempts to be tolerant of squiffy code, and run as fast as it can. The brush has a hand written tokenizer that drastically outperforms the initial regexen based solution.

<img src="http://media.brehaut.net/files/tmp/clojure-brush.png">



## Improvements over sh-clojure

 * Full tokenizer and parser allow for structure aware highlighting:
    * `comment …` forms are correctly highlighted.
    * Doesn't need to use a list of `clojure.core` symbols; can infer meaning from position in a    
      form.
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
 
 * Internet Explorer testing.
 * All the destructuring rules need to be supported for scopes.
 * Function annotators (for arguments). 
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