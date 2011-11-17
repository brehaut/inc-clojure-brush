# (inc clojure-brush)

## ;; Work In Progress

This project aims to product a smarter clojure brush for [Syntax Highlighter](https://github.com/alexgorbatchev/SyntaxHighlighter) that goes further than existing efforts such as [sh-clojure](https://github.com/sattvik/sh-clojure). This brush attempts to be moderately aware of sexp forms in clojure and provide sensible highlighting rules for core forms, and hopefully guess sensibly for additional forms. 

In addition to correctness, this brush attempts to be tolerant of squiffy code, and run as fast as it can. The brush has a hand written tokenizer that drastically outperforms the initial regexp based solution (down from 80% of total runtime in chrome and safari to between 0 and 10%).

<img src="http://media.brehaut.net/files/tmp/clojure-brush.png">

**Not Ready For Real Use!** 

No error handling exists yet. Bugs abound.

The code is pretty hairy in a lot of places.

## Todo 
 
 * Tokenizer for Constructor literals.
 * All the destructuring rules need to be supported for scopes.
 * Function annotators (for arguments).
 * Expose registering custom form annotation rules.
 * Support configuration for coloring locals.
 * Exponents in number literals, hex literals 

## Improvements over sh-clojure

 * Full tokenizer and parser allow for structure aware highlighting:
    * `comment …` forms are correctly highlighted.
    * Doesn't need to use a list of `clojure.core` symbols; can infer meaning from position in a    
      form.
    * Differentiates between #{functions, macros}, #{methods and constructors}.
    * Knows about name binding forms such as let, binding, for, etc
       * Tracks locals and highlights them separately
    * Handles metadata
       * Styling is supported with appropriate CSS.    
    * Detects malformed code
       * Limited to incorrectly closed aggregate expressions currently
 * Performance is equal to or faster than `sh-clojure` despite doing more.
 * Characters (including \newline, \tab, and \space) handled correctly.
 * Supports radix's, and ratios in number literals.

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