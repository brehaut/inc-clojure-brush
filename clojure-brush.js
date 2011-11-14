// This clojure brush 
//
//


var ClojureBrush = (function (SH) {

  var clojure_names = { 
    special_forms:
  	'. def do fn if let loop monitor-enter monitor-exit new quote recur set! ' +
  	'throw try var',
	
  	clojure_core:
  	'* *1 *2 *3 *agent* *allow-unresolved-vars* *assert* *clojure-version* ' +
  	'*command-line-args* *compile-files* *compile-path* *e *err* *file* ' +
  	'*flush-on-newline* *in* *macro-meta* *math-context* *ns* *out* ' +
  	'*print-dup* *print-length* *print-level* *print-meta* *print-readably* ' +
  	'*read-eval* *source-path* *use-context-classloader* ' +
  	'*warn-on-reflection* + - -> -&gt; ->> -&gt;&gt; .. / < &lt; <= &lt;= = ' +
  	'== > &gt; >= &gt;= accessor aclone ' +
  	'add-classpath add-watch agent agent-errors aget alength alias all-ns ' +
  	'alter alter-meta! alter-var-root amap ancestors and apply areduce ' +
  	'array-map aset aset-boolean aset-byte aset-char aset-double aset-float ' +
  	'aset-int aset-long aset-short assert assoc assoc! assoc-in associative? ' +
  	'atom await await-for await1 bases bean bigdec bigint binding bit-and ' +
  	'bit-and-not bit-clear bit-flip bit-not bit-or bit-set bit-shift-left ' +
  	'bit-shift-right bit-test bit-xor boolean boolean-array booleans ' +
  	'bound-fn bound-fn* butlast byte byte-array bytes cast char char-array ' +
  	'char-escape-string char-name-string char? chars chunk chunk-append ' +
  	'chunk-buffer chunk-cons chunk-first chunk-next chunk-rest chunked-seq? ' +
  	'class class? clear-agent-errors clojure-version coll? comment commute ' +
  	'comp comparator compare compare-and-set! compile complement concat cond ' +
  	'condp conj conj! cons constantly construct-proxy contains? count ' +
  	'counted? create-ns create-struct cycle dec decimal? declare definline ' +
  	'defmacro defmethod defmulti defn defn- defonce defstruct delay delay? ' +
  	'deliver deref derive descendants destructure disj disj! dissoc dissoc! ' +
  	'distinct distinct? doall doc dorun doseq dosync dotimes doto double ' +
  	'double-array doubles drop drop-last drop-while empty empty? ensure ' +
  	'enumeration-seq eval even? every? false? ffirst file-seq filter find ' +
  	'find-doc find-ns find-var first float float-array float? floats flush ' +
  	'fn fn? fnext for force format future future-call future-cancel ' +
  	'future-cancelled? future-done? future? gen-class gen-interface gensym ' +
  	'get get-in get-method get-proxy-class get-thread-bindings get-validator ' +
  	'hash hash-map hash-set identical? identity if-let if-not ifn? import ' +
  	'in-ns inc init-proxy instance? int int-array integer? interleave intern ' +
  	'interpose into into-array ints io! isa? iterate iterator-seq juxt key ' +
  	'keys keyword keyword? last lazy-cat lazy-seq let letfn line-seq list ' +
  	'list* list? load load-file load-reader load-string loaded-libs locking ' +
  	'long long-array longs loop macroexpand macroexpand-1 make-array ' +
  	'make-hierarchy map map? mapcat max max-key memfn memoize merge ' +
  	'merge-with meta method-sig methods min min-key mod name namespace neg? ' +
  	'newline next nfirst nil? nnext not not-any? not-empty not-every? not= ' +
  	'	ns ns-aliases ns-imports ns-interns ns-map ns-name ns-publics ' +
  	'ns-refers ns-resolve ns-unalias ns-unmap nth nthnext num number? odd? ' +
  	'or parents partial partition pcalls peek persistent! pmap pop pop! ' +
  	'pop-thread-bindings pos? pr pr-str prefer-method prefers ' +
  	'primitives-classnames print print-ctor print-doc print-dup print-method ' +
  	'print-namespace-doc print-simple print-special-doc print-str printf ' +
  	'println println-str prn prn-str promise proxy proxy-call-with-super ' +
  	'proxy-mappings proxy-name proxy-super push-thread-bindings pvalues quot ' +
  	'rand rand-int range ratio? rational? rationalize re-find re-groups ' +
  	're-matcher re-matches re-pattern re-seq read read-line read-string ' +
  	'reduce ref ref-history-count ref-max-history ref-min-history ref-set ' +
  	'refer refer-clojure release-pending-sends rem remove remove-method ' +
  	'remove-ns remove-watch repeat repeatedly replace replicate require ' +
  	'reset! reset-meta! resolve rest resultset-seq reverse reversible? rseq ' +
  	'rsubseq second select-keys send send-off seq seq? seque sequence ' +
  	'sequential? set set-validator! set? short short-array shorts ' +
  	'shutdown-agents slurp some sort sort-by sorted-map sorted-map-by ' +
  	'sorted-set sorted-set-by sorted? special-form-anchor special-symbol? ' +
  	'split-at split-with str stream? string? struct struct-map subs subseq ' +
  	'subvec supers swap! symbol symbol? sync syntax-symbol-anchor take ' +
  	'take-last take-nth take-while test the-ns time to-array to-array-2d ' +
  	'trampoline transient tree-seq true? type unchecked-add unchecked-dec ' +
  	'unchecked-divide unchecked-inc unchecked-multiply unchecked-negate ' +
  	'unchecked-remainder unchecked-subtract underive unquote ' +
  	'unquote-splicing update-in update-proxy use val vals var-get var-set ' +
  	'var? vary-meta vec vector vector? when when-first when-let when-not ' +
  	'while with-bindings with-bindings* with-in-str with-loading-context ' +
  	'with-local-vars with-meta with-open with-out-str with-precision xml-seq ' +
  	'zero? zipmap '
  }

  for (var k in clojure_names) if (clojure_names.hasOwnProperty(k)) {
    clojure_names[k] = clojure_names[k].split(" ");
  }
  
  // end of clojure metadata
 
  // utiliies

  function extend(o, extension) {
    for (var k in extension) if (extension.hasOwnProperty(k)) {
      o[k] = extension[k];
    }
    return o;
  }

  function object(o) {
    function F() {};
    F.prototype = o;  
    return new F();
  }
  
  function map(l, f) {
    var nl = [];
    for (var i = 0, j = l.length; i < j; i++) {
      nl.push(f(l[i]));
    }
    return nl;
  }
  
  function filter(l, f) {
    var nl = [];
    for (var i = 0, j = l.length; i < j; i++) {
      if (f(l[i])) nl.push(l[i]);
    }
    return nl;
  }
  
  function mapcat(l, f) {
    return Array.prototype.concat.apply([], map(l, f));
  }
  
  // data
  
  function Token(value, index, tag, length) {
     if (!(this instanceof Token)) 
        return new Token(value, index, tag, length);
    this.value = value;
    this.index = index;
    this.length = length || value.length;
    this.tag = tag;
  }
  Token.prototype = {
    clone: function () {
      return new Token(this.value, this.index, this.tag, this.length);
    },
    
    toMatches: function () {
      var m = object(this);
      if (!m.css) m.css = this.tag;
      return [m];
    }
  };
  
  /* LispNodes are aggregate nodes for sexpressions. 
   *
   */
  function LispNode(tag, parent, children, opening, closing) {
    if (!(this instanceof LispNode)) 
      return new LispNode(tag, parent, children, opening, closing);
      
    this.tag = tag;         // current metadata for syntax inference
    this.parent = parent;   // the parent expression
    this.list = children;   // all the child forms in order
    this.opening = opening; // the token that opens this form.
    this.closing = closing; // the token that closes this form.
    
    this.depth = parent.depth + 1;
  };
  LispNode.prototype = {
    clone: function () {
      return new LispNode(this.tag, this.parent, 
                          this.list.slice(),
                          object(opening), object(closing));
    },
    /* SyntaxHighlighter expects Match shaped objects; Each node 
     * knows how to produce an array of Match objects on demand.
     *
     * A match must contain:
     *   value :: String
     *   index :: Int 
     *   length :: Int
     *   css :: String
     *
     * Some nodes may use specalised toMatches methods to produce specalised
     * sets of matches.
     */
    toMatches: function () {
      return [this.opening].concat(mapcat(this.list, function (node) {
        return node.toMatches();
      }), [this.closing]);
    }
  };
  
  
  function MetaNode(meta_token, meta_form, parent) {
    if (!(this instanceof MetaNode)) 
      return new MetaNode(meta_token, meta_form, parent);
    
    this.meta_token = meta_token;
    this.meta_form = meta_form;
    this.parent = parent;
  }
  MetaNode.prototype = {
    clone: function () {
      return new MetaNode(this.meta_token, this.meta_form, this.parent);
    },
    
    toMatches: function () {
      return [].concat(this.meta_token.toMatches(), this.meta_form.toMatches());
    }
  };
  
  
  // tokenize

  function one_of () {
    var args = arguments;
    return function (s) {
      for (var i = 0; i < args.length; i++) {
        var prefix = args[i];
        if ((s.slice(0, prefix.length) == prefix)) {
          return {value: args[i], tag: args[i]};
        }
      }
    };
  }

  function re (re, tag) {
    return function (s) {
      var match = s.match(re);
      if (match != null) return {value:match[0], tag:tag};
    }
  }

  function tokenize (code) {
    var tokens = [];

    var match = null;
    var idx = 0;

    var rules = [
      re(/^\\(newline|space|tab|.)/, "value"),
      re(/^[+-]?\d+([r.\/]\d+|M)?/, "value"),   
    
      re(/^#"(?:\.|(\\\")|[^\""\n])*"/g, "string"), // regexp
      re(new XRegExp('^"([^\\\\"]|\\\\.)*"', 'gs'), "string"),
    
      re(/^[-a-z*?!.><|&%][-a-z*?!.><|&%0-9\/]*/i, "symbol"),
      re(/^:?[-a-z*?!.><|&%][-a-z*?!.><|&%0-9\/]*/i, "keyword"),
      one_of("#(", ")", "(", ")", "#{", "{", "}", "[", "]", "^", "@"),  
      re(/^[\s,]+/, "whitespace"),  
      re(new RegExp('^;.*$', 'gm'), "comments"),                           
    
      function (s) {   // just eat everything that remains
        return { value:s[0], tag:"invalid" };
      }
    ];
    
    var prev = null;
    while (code.length) {
      match = null;
      for (var i = 0; i < rules.length; i++) {
        if (match = rules[i](code)) {
          var l = match.value.length;
          var t = Token(match.value, idx, match.tag, l);
          tokens.push(t); 
          idx += l;
          code = code.slice(l);
          break;
        }
      }
    }

    return tokens;
  }

  function ignore_whitespace(tokens) {
      return filter(tokens, function (token) { 
        return !(token.tag == "whitespace"
                 || token.tag == "comments");
      });
  }

  function new_scope(parent, opening_token, scope_type) {
    var scope = new LispNode(scope_type, parent, [], opening_token, null);
  
    parent.list.push(scope);
  
    return scope;  
  }

  function list_exp(parent, opening_token) {
    return new_scope(parent, opening_token, "list");
  }

  function vector_exp(parent, opening_token) {
    return new_scope(parent, opening_token, "vector");
  }

  function map_exp(parent, opening_token) {
    return new_scope(parent, opening_token, "map");
  }

  function set_exp(parent, opening_token) {
    return new_scope(parent, opening_token, "set");
  }

  function build_sexps(tokens) {
    var current = {
      list: [], 
      tag: "toplevel", 
      parent: null, 
      opening: null,
      closing: null,
      depth: -1
    };

    for (var i = 0, j = tokens.length; i < j; i++) {
      var t = tokens[i];
      switch (t.tag) {
        case "^":
        case "#^":
          
          break;
          
        case "(":
        case "#(":   
          current = list_exp(current, t);
          break;
        
        case "[": 
          current = vector_exp(current, t);
          break;
        
        case "{": 
          current = map_exp(current, t);
          break;
        
        case "#{": 
          current = set_exp(current, t);
          break;  
        
        case ")":
        case "]":
        case "}":              
          current.closing = t;
          current = current.parent;
          break;
        
        default:
          current.list.push(t);
      }
    }
  
    return current;
  }

  function clone_exp (exp) {
    var n = object(exp);
    n.list = exp.list.slice();
    return n;
  }

  // annotation rules to apply to a form based on its head

  function annotate_destructuring (exp) {
    if (exp.list) {
      if (exp.tag == "vector") {
        for (var i = 0; i < exp.list.length; i++) {
          annotate_destructuring(exp.list[i]);
        }
      } 
      else if (exp.tag == "map") {
        for (var i = 0; i < exp.list.length; i += 2) {
          annotate_destructuring(exp.list[i]);
          exp.list[i + 1].css = "plain";
        } 
      }
    } else {
      exp.css ="variable";
    }
  }

  function annotate_arguments (exp) {
    var n = clone_exp(exp);
  
    return n; 
  }

  function _annotate_binding_vector (exp, special_cases) {
    if (exp.tag != "vector") return exp;
    special_cases = special_cases || function (name, exp) {};
  
    var n = clone_exp(exp);
    var bindings = [];
    
    for (var i = 0; i < n.list.length; i ++) {
      /*if (n.list[i].tag != "comments") */bindings.push(n.list[i]);
    }
    
    if (bindings.length % 2 == 1) return exp;
    
    for (var i = 0; i < bindings.length; i += 2) {
      annotate_destructuring(bindings[i]);
      annotate_expressions(bindings[i + 1]);
      special_cases(bindings[i], bindings[i + 1]);
    }
    return exp;
  }

  function annotate_binding (exp) {
    var n = clone_exp(exp);
  
    var bindings = exp.list[1];
    if (bindings) {
      n.list[1] = _annotate_binding_vector(bindings);
    }
  
    return n;
  }

  function annotate_comprehension (exp) {
    var n = clone_exp(exp);
  
    var bindings = exp.list[1];
    if (bindings) {
      n.list[1] = _annotate_binding_vector(bindings, function (name, exp) {
        if (name.tag == "keyword" && (name.value == ":when" || name.value == ":let")) {
          name.css = "functions";
        }
      });
    }
  
    return n;
  }

  var annotation_rules = (function () {
    var rules = {};
  
    for (var i = 0; i < arguments.length; i+=2) {
      for (var j = 0; j < arguments[i].length; j++) {
        rules[arguments[i][j]] = arguments[i+1];
      }
    }
  
    return rules;
  })(
    ["comment"],  
    function annotate_comment(exp) {
      var n = clone_exp(exp);
      n.tag = "comments";
      n.opening.css = "comments";
      n.closing.css = "comments";
      n.list = [];
      for (var i = 0; i < exp.list.length; i++) {
        var child = exp.list[i];
        n.list.push(child.list 
                     ? annotate_comment(child)
                     : extend(object(child), { css: "comments" }));
      }
      return n;
    },
  
    ["let", "binding"], annotate_binding,
    ["doseq", "for", "domonad"], annotate_comprehension
  );


  function annotate_expressions(exp) {
    
    var n = object(exp);

    switch (exp.tag) {
      case "toplevel": 
        n.list = [];
        for (var i = 0; i < exp.list.length; i++) {
          n.list.push(annotate_expressions(exp.list[i]));
        }
        break;
      
      case "list": // functions, macros, special forms, comments
        var rainbow = "rainbow" + ((exp.depth % 5) + 1);
        exp.opening.css = rainbow;
        exp.closing.css = rainbow;
        
        var head = exp.list[0];
      
        if (head) {
          if (head.tag.match(/list|vector|map/)) {
            head = annotate_expressions(head);
          }
          else if (clojure_names.special_forms.indexOf(head.value) >= 0) {
            head.css = "preprocessor";        
          } 
          else if (clojure_names.clojure_core.indexOf(head.value) >= 0) {
            head.css = "functions";
          }
          
          n.list = [head];
          for (var i = 1; i < exp.list.length; i++) {
            n.list.push(annotate_expressions(exp.list[i]));
          }

          // apply specific rules
          if (annotation_rules.hasOwnProperty(head.value)) {
            return annotation_rules[head.value](exp);
          }       
        }
      
        break;
      
      case "vector": // data
      case "map":
      case "set":
        n.list = [];
        n.opening.css = "keyword";
        n.closing.css = "keyword";
        for (var i = 0; i < exp.list; i++) {
          n.list.push(annotate_expressions(exp.list[i]));
        }
        break;
    
      case "keyword":
        n.css = "constant";
        break;
    }
  
    return n;
  }

  function flatten_to_buffer(exp, buffer) {
    if (exp.list) {
      if (exp.opening) buffer.push(exp.opening);
      for (var i = 0; i < exp.list.length; i++) {
        flatten_to_buffer(exp.list[i], buffer);
      }
      if (exp.closing) buffer.push(exp.closing);
    }
    else {
      buffer.push(exp);
    }
  }
  
  // create the new brush

  SH.brushes.Clojure = function () {

    this.findMatches = function (regexpList, code) {
      var tokens = tokenize(code);
      
      // seperate out interesting and uninteresting tokens; we want to highlight
      // comments and whitespace correctly but it just gets in the way of sexp processing
      var interesting = filter(tokens, function (token) { 
        return !(token.tag == "whitespace"
                 || token.tag == "comments");
      });
      var uninteresting = filter(tokens, function (token) { 
        return (token.tag == "whitespace"
                || token.tag == "comments");
      });

      var sexps = build_sexps(interesting);
      
      var buffer = uninteresting;//[];
      flatten_to_buffer(annotate_expressions(sexps), buffer);
      
      buffer = map(buffer, function (token) {
        if (!token.css) return extend(object(token), {css: token.tag});
        return token;
      });
    
      // need to ensure that the resulting tokens are in order
      buffer.sort(function(a,b) {
        if (a.index == b.index) return 0;
        if (a.index < b.index) return -1;
        return 1;
      });
    
      return buffer;
    };
  
  }

  SH.brushes.Clojure.prototype = new SyntaxHighlighter.Highlighter();
  SH.brushes.Clojure.aliases   = ['clojure', 'Clojure', 'clj'];

  return {};
})(SyntaxHighlighter);
