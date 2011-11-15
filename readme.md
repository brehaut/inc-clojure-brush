# (inc clojure-brush)

## ;; Work In Progress

This project aims to product a smarter clojure brush for [Syntax Highlighter](https://github.com/alexgorbatchev/SyntaxHighlighter) that goes further than existing efforts such as [sh-clojure](https://github.com/sattvik/sh-clojure). This brush attempts to be moderately aware of sexp forms in clojure and provide sensible highlighting rules for core forms, and hopefully guess sensibly for additional forms. 

The current state of this project is a stream of consciousness javascript file. You'll need to know how to set up SyntaxHighlighter if you want to play with it (i'll get a demo setup later). 

<img src="http://media.brehaut.net/files/tmp/clojure-brush.png">

**Not Ready For Real Use!** 

No error handling exists yet. Bugs abound.

The code is pretty hairy in a lot of places.

## Improvements over sh-clojure

 * `(comment …)` forms are correctly highlighted.
 * Doesn't need to use a list of `clojure.core` symbols; can infer from position in a form.
 * Differentiates between functions and macros, and methods and constructors.
 * Knows about name binding forms such as let, binding, for, etc
 * Rainbow Parens (with appropriate CSS)

### Thanks

 * [Daniel Solano Gómez](http://www.deepbluelambda.org/) for his original Clojure Brush.