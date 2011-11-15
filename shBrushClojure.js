// This clojure brush 
//
//


var ClojureBrush = (function (SH) {
  "use strict";
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
      nl[i] = f(l[i]);
    }
    return nl;
  }
  
  function filter(l, f) {
    var nl = [];
    for (var i = 0, j = l.length; i < j; i++) {
      if (f(l[i])) nl[nl.length] = l[i];
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
    
    this.depth = parent ? (parent.depth + 1) : 0;
  };

  
  function MetaNode(meta_token, meta_form, parent) {
    if (!(this instanceof MetaNode)) 
      return new MetaNode(meta_token, meta_form, parent);
    
    this.meta_token = meta_token;
    this.meta_form = meta_form;
    this.parent = parent;
  }

  
  
  // tokenize

  function one_of (s, args) {
    for (var i = 0; i < args.length; i++) {
      var prefix = args[i];
      if ((s.slice(0, prefix.length) === prefix)) {
        return args[i];
      }
    }
  }


  function tokenize (code) {
    var tokens = [];

    var match = null;
    var idx = 0;
    var t = null;
    var nextTokenIdx = 0;
    var l = 0;
    
    var multiline_string_regexp = new XRegExp('^"([^\\\\"]|\\\\.)*"', 'gs');
    var comments_regexp = new RegExp('^;.*$', 'gm');

    while (code.length) {
      match = null;

      if (match = code.match(/^\\(newline|space|tab|.)/)) { // characters
        l = match[0].length;
        t = new Token(match[0], idx, "value", l);
      }
      else if (match = code.match(/^[+-]?\d+([r.\/]\d+|M)?/)) { // numbers
        l = match[0].length;
        t = new Token(match[0], idx, "value", l);        
      } 
      else if (match = code.match(/^#"(?:\.|(\\\")|[^\""\n])*"/g)) { // regexps
        l = match[0].length;
        t = new Token(match[0], idx, "string", l);                
      }
      else if (match = code.match(multiline_string_regexp)) { // strings
        l = match[0].length;
        t = new Token(match[0], idx, "string", l);                
      }
      else if (match = code.match(/^:?[-_a-z*?!.><|&%][-_a-z*?!.><|&%0-9\/]*/i)) {// sym and key
        l = match[0].length;
        t = new Token(match[0], idx, match[0][0] === ":" ? "keyword" : "symbol", l);
      }
      else if (match = one_of(code, ["#(", "(", ")", 
                                     "#{", "{", "}", 
                                     "[", "]", "^", 
                                     "@"])) {
        l = match.length;
        t = new Token(match, idx, match, l);                                
      }
      else if (match = code.match(/^[\s,]+/)) { // whitespace
        l = match[0].length;
        t = new Token(match[0], idx, "whitespace", l);
      }
      else if (match = code.match(comments_regexp)) { // comments
        l = match[0].length;
        t = new Token(match[0], idx, "comments", l);        
      }
      else {
        l = 1;
        t = new Token(code[0], idx, "invalid", 1);
      }
      
      idx += l;
      code = code.slice(l);
      tokens[nextTokenIdx++] = t;
    }

    return tokens;
  }


  function new_scope(parent, opening_token, scope_type) {
    var scope = new LispNode(scope_type, parent, [], opening_token, null);
  
    if (parent) parent.list[parent.list.length] = scope;
  
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
    var toplevel = {
      list: [], 
      tag: "toplevel", 
      parent: null, 
      opening: null,
      closing: null,
      depth: -1
    };
    var current = toplevel;

    for (var i = 0, j = tokens.length; i < j; i++) {
      if (current == null) debugger 
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
          // dont let the top level from pop off just because someone put too many closing 
          // parens in their forms
          if (current.parent) current = current.parent; 
          break;
        
        default:
          current.list.push(t);
      }
    }
    return toplevel;
  }

  // annotation rules to apply to a form based on its head

  function annotate_destructuring (exp) {
    if (exp.list) {
      if (exp.tag === "vector") {
        for (var i = 0; i < exp.list.length; i++) {
          annotate_destructuring(exp.list[i]);
        }
      } 
      else if (exp.tag === "map") {
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
    return exp; 
  }

  function _annotate_binding_vector (exp, special_cases) {
    if (exp.tag != "vector") return exp;
    special_cases = special_cases || function (name, exp) {};
  
    var bindings = exp.list;

    if (bindings.length % 2 === 1) return exp;
    
    for (var i = 0; i < bindings.length; i += 2) {
      annotate_destructuring(bindings[i]);
      annotate_expressions(bindings[i + 1]);
      special_cases(bindings[i], bindings[i + 1]);
    }
  }

  function annotate_binding (exp) {
    var bindings = exp.list[1];
    if (bindings) {
      _annotate_binding_vector(bindings);
    }
  }

  function annotate_comprehension (exp) {
    var bindings = exp.list[1];
    if (bindings) {
      _annotate_binding_vector(bindings);
    }
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
      exp.tag = "comments";
      exp.opening.css = "comments";
      exp.closing.css = "comments";
      for (var i = 0; i < exp.list.length; i++) {
        var child = exp.list[i];
        if (child.list) {
          annotate_comment(child);
        }
        else {
          extend(object(child), { css: "comments" });
        }
      }
      return exp;
    },
  
    ["let", "binding", "doseq", "for", "domonad"], annotate_binding
  );


  function annotate_expressions(exp) {
    switch (exp.tag) {
      case "toplevel": 
        for (var i = 0; i < exp.list.length; i++) {
          annotate_expressions(exp.list[i]);
        }
        break;
      
      case "list": // functions, macros, special forms, comments
        exp.opening.css = "rainbow" + ((exp.depth % 5) + 1);
        if (exp.closing) exp.closing.css = exp.opening.css;
        var head = exp.list[0];
      
        if (head) {
          if (head.tag.match(/list|vector|map/)) {
            annotate_expressions(head);
          }
          else {
            if (head.value.match(/(^\.)|(\.$)|[A-Z].*\//)) {
              head.css = "color1";
            }
            else {
              head.css = "functions";
            }
          }
          
          for (var i = 1; i < exp.list.length; i++) {
            annotate_expressions(exp.list[i]);
          }

          // apply specific rules
          if (annotation_rules.hasOwnProperty(head.value)) {
            annotation_rules[head.value](exp);
          }       
        }
        else { // empty list
          exp.opening.css = exp.closing.css = "constants";
        }
      
        break;
      
      case "vector": // data
      case "map":
      case "set":
        exp.opening.css = "keyword";
        if (exp.closing) exp.closing.css = "keyword";
        for (var i = 0; i < exp.list.length; i++) {
          annotate_expressions(exp.list[i]);
        }
        break;
        
      case "symbol":
        if (exp.value.match(/[A-Z].*\/[A-Z_]+/)) {
          exp.tag = "constants";
          exp.css = "constants";
        }
        break;
    
      case "keyword":
        exp.css = "constants";
        break;
    }
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

    this.findMatches = function find_matches (regexpList, code) {
      console.profile();
      var tokens = tokenize(code);
      
      // seperate out interesting and uninteresting tokens; we want to highlight
      // comments and whitespace correctly but it just gets in the way of sexp processing
      var interesting = filter(tokens, function (token) { 
        return !(token.tag === "whitespace"
                 || token.tag === "comments"
                 || token.tag === "invalid");
      });

      var sexps = build_sexps(interesting);
      annotate_expressions(sexps)
      console.profileEnd();
      return map(tokens, function (token) {
        if (!token.css) {
          return extend(object(token), {css: token.tag});
        }
        return token;
      });
    };
  
  }

  SH.brushes.Clojure.prototype = new SyntaxHighlighter.Highlighter();
  SH.brushes.Clojure.aliases   = ['clojure', 'Clojure', 'clj'];

  return {};
})(SyntaxHighlighter);
