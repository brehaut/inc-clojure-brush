// This clojure brush 
//
//


var ClojureBrush = (function (SH) {
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
    
      re(/^[-_a-z*?!.><|&%][-_a-z*?!.><|&%0-9\/]*/i, "symbol"),
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
        n.opening.css = n.closing.css = "rainbow" + ((exp.depth % 5) + 1);;
        
        var head = exp.list[0];
      
        if (head) {
          if (head.tag.match(/list|vector|map/)) {
            head = annotate_expressions(head);
          }
          else {
            if (head.value.match(/(^\.)|(\.$)|[A-Z].*\//)) {
              head.css = "color1";
            }
            else {
              head.css = "functions";
            }
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
        else { // empty list
          console.log("()")
          n.opening.css = n.closing.css = "constants";
        }
      
        break;
      
      case "vector": // data
      case "map":
      case "set":
        n.list = [];
        n.opening.css = "keyword";
        n.closing.css = "keyword";
        for (var i = 0; i < exp.list.length; i++) {
          n.list.push(annotate_expressions(exp.list[i]));
        }
        break;
        
      case "symbol":
        console.log(exp.value, exp.value.match(/[A-Z].*\//))
        if (exp.value.match(/[A-Z].*\/[A-Z_]+/)) {
          n.css = "constant";
        }

        break
    
      case "keyword":
        n.css = "constants";
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
