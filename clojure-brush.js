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


  function starts_with (prefix, s) { 
    return (s.slice(0, prefix.length) == prefix);    
  }

  function one_of () {
    var args = arguments;
    return function (s) {
      for (var i = 0; i < args.length; i++) {
        if (starts_with(args[i], s)) {
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
      one_of("(", ")", "#{", "{", "}", "[", "]", "^", "@"),  
      re(/^[\s,]+/, "whitespace"),  
      re(new RegExp('^;.*$', 'gm'), "comments"),                           
    
      function (s) {   // just eat everything that remains
        return { value:s, tag:"remainder" };
      }
    ];

    while (code.length) {
      match = null;
      for (var i = 0; i < rules.length; i++) {
        if (match = rules[i](code)) {
          var l = match.value.length
          tokens.push(extend(match, {index: idx, length: l})); 
          idx += l;
          code = code.slice(l);
          break;
        }
      }
    }

    return tokens;
  }

  function ignore_whitespace(tokens) {
    var without_whitespace = [];
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].tag != "whitespace") without_whitespace.push(tokens[i]);
    }

    return without_whitespace;
  }

  function new_scope(parent, opening_token, scope_type) {
    var scope = {
      list: [],
      tag: scope_type,
      parent: parent,
      opening: opening_token,
      closing: null,
      depth: parent.depth + 1
    };
  
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

    tokens = ignore_whitespace(tokens);
  
    for (var i = 0, j = tokens.length; i < j; i++) {
      var t = tokens[i];
      switch (t.tag) {
        case "(": 
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
      if (n.list[i].tag != "comments") bindings.push(n.list[i]);
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
      var sexps = build_sexps(tokens);

      var buffer = [];
      flatten_to_buffer(annotate_expressions(sexps), buffer);
      for (var i = 0; i < buffer.length; i++) {
        if (!buffer[i].css) buffer[i].css = buffer[i].tag;
      }
    
      return buffer;
    };
  
  }

  SH.brushes.Clojure.prototype = new SyntaxHighlighter.Highlighter();
  SH.brushes.Clojure.aliases   = ['clojure', 'Clojure', 'clj'];

  return {};
})(SyntaxHighlighter);
