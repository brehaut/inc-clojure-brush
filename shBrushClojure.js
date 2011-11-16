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
    this.meta = null;       // metadata nodes will be attached here if they are found
    this.scope = {};        // any binding forms may insert names into here for locals lookup
    
    this.depth = parent ? (parent.depth + 1) : 0;
  };

  
  function MetaNode(meta_token, parent) {
    if (!(this instanceof MetaNode)) 
      return new MetaNode(meta_token, parent);
    
    this.meta_token = meta_token;
    this.attached_node = null;
    this.parent = parent;
  }

  
  
  // tokenize

  function tokenize(code) {
    var tokens = [];
    var tn = 0;
    
    var zero = "0".charCodeAt(0);
    var nine = "9".charCodeAt(0); 
    
    var dispatch = false; // have we just seen a # character?
    
    // i tracks the start of the current window
    // extent is the window for slicing
    
    for (var i = 0, 
             extent = i, 
             j = code.length; 
             i < j && extent <= j;) {          
                
      var c = code[i];
      
      // we care about capturing the whole token when dispatch is used, so back up the
      // starting index by 1
      if (dispatch) i--; 
      
      switch (c) {
        // dispatch alters the value of the next thing read
        case "#":
          dispatch = true;
          i++;
          extent++;
          continue;
          
        case " ":    // ignore whitespace
        case "\t":
        case "\n":
        case "\r": 
          extent++
          break; 
          
        // simple terms
        case "^":
        case "`":
        case ")":
        case "[":
        case "]":
        case "}":
        case "@":
          tokens[tn++] = new Token(c, i, c, ++extent - i);
          break;
        
        case "'":
          tokens[tn++] = new Token(code.slice(i, ++extent), i, dispatch ? "#'" : "'", extent - i);
          break
        
        case "(":
          tokens[tn++] = new Token(code.slice(i, ++extent), i, "(", extent - i);
          break;          
          
        case "{":
          tokens[tn++] = new Token(code.slice(i, ++extent), i, dispatch ? "#{" : "{", extent - i);
          break;  
        
        case "\\":
          if (code.slice(i + 1, i + 8) === "newline") {
            tokens[tn++] = new Token("\\newline", i, "value", 8);
            extent = i + 9; 
          }
          else if (code.slice(i + 1, i + 6) === "space") {
            tokens[tn++] = new Token("\\space", i, "value", 6);
            extent = i + 7;
          }
          else if (code.slice(i + 1, i + 4) === "tab") {
            tokens[tn++] = new Token("\\tab", i, "value", 4);
            extent = i + 5;
          }
          else {
            extent += 2;
            tokens[tn++] = new Token(code.slice(i, extent), i, "value", 2);
          }
          break;
        
        // complicated terms
        case "\"": // strings and regexps
          for (extent++; extent <= j; extent++) {
            if (code[extent] === "\\") extent++;
            else if (code[extent] === "\"") break;
          }
          tokens[tn++] = new Token(code.slice(i, ++extent), i, dispatch ? "regexp" : "string", extent - i);       
          break;
          
        case ";":
          for (; extent <= j && code[extent] !== "\n" && code[extent] !== "\r"; extent++);
          tokens[tn++] = new Token(code.slice(i, ++extent), i, "comments", extent - i);   
          break;
        
        case "+": // numbers; fall through to symbol for + and - not prefixing a number
        case "-":
          extent++; // step on one so that we can test numbers correctly
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          var c2 = code[i + 1];
          if (((c === "+" || c === "-") && c2.match(/[0-9]/)) // prefixes
              || (c !== "+" && c !== "-")) {
            for (; extent <= j; extent++) {
              var charCode = code.charCodeAt(extent);
              if (charCode < zero || charCode > nine) break;
            }
            
            c = code[extent];
            c2 = code[extent + 1];
            if ((c === "r" || c === "R" || c === "/" || c === ".") // interstitial characters
                && c2.match(/[0-9]/)) {
              for (extent++; extent <= j; extent++) {
                var charCode = code.charCodeAt(extent);
                if (charCode < zero || charCode > nine) break;
              }
            }
            
            c = code[extent];
            if (c === "N" || c === "M") extent++;

            tokens[tn++] = new Token(code.slice(i, extent), i, "value", extent - i);
            break;
          }

        case "_":
          if (dispatch && c === "_") {
            tokens[tn++] = new Token(code.slice(i, ++extent), i, "skip", extent - i);
            break;
          } // if not a skip, fall through to symbols
        
        // Allow just about any other symbol as a symbol. This is far more permissive than 
        // clojure actually allows, but should catch any weirdo crap that accidentally gets
        // into the code.
        default: 
          for (extent++; extent <= j; extent++) {
            switch (code[extent]) {
              case " ":
              case "\t":
              case "\n":
              case "\r":
              case "\\":
              case "{":
              case "}":
              case "(":
              case ")":
              case "[":
              case "]":
              case "#":
              case "^":
              case "`":
              case "@":   
                break;
              case ";":   
                // theres a weird bug via syntax highligher that gives us escaped entities.
                // need to watch out for these
                if (code.slice(extent-3, extent+1) === "&lt;"
                    ||code.slice(extent-3, extent+1) === "&gt;"
                    ||code.slice(extent-4, extent+1) === "&amp;") {
                  continue;
                }
                break;
              default:
                continue;
            }
            break;
          }
          
          var value = code.slice(i, extent);
          var tag = "symbol";
          if (value[0] == ":") {
            tag = "keyword";
          }
          else if (value === "true" || value === "false" || value === "nil") {
            tag = "value";
          }
          tokens[tn++] = new Token(value, i, tag, extent - i);
      }
      
      dispatch = false;
      i = extent;
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

    var pending_meta = null;
    var collect_next = false;
    
    for (var i = 0, j = tokens.length; i < j; i++) {
      var t = tokens[i];

      switch (t.tag) {
        case "^":
        case "#^":
          pending_meta = new MetaNode(t, current);
          collect_next = true;
          continue;
          
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
          t.parent = current;
          current.list.push(t);
      }
      
      if (collect_next) {
        switch (t.tag) {
          case "(":
          case "#(":   
          case "{":
          case "#{":
            pending_meta.attached_node = current;
            current.parent.list.splice(current.parent.list.length - 1, 1); // hack
            break;
          default:
            pending_meta.attached_node = t;
        }

        collect_next = null;
      }
      else if (pending_meta){
        current.meta = pending_meta;
        pending_meta = null;
      }
    }
    return toplevel;
  }

  // annotation rules to apply to a form based on its head

  function annotate_destructuring (exp, scope) {
    if (exp.list) {
      if (exp.tag === "vector") {
        for (var i = 0; i < exp.list.length; i++) {
          annotate_destructuring(exp.list[i], scope);
        }
      } 
      else if (exp.tag === "map") {
        for (var i = 0; i < exp.list.length; i += 2) {
          annotate_destructuring(exp.list[i], scope);
          exp.list[i + 1].css = "plain";
        } 
      }
    } 
    else if (exp.tag === "symbol"){
      exp.tag = "variable";
      scope[exp.value] = true;
    }
  }

  function annotate_arguments (exp) {
    return exp; 
  }

  function _annotate_binding_vector (exp, scope, special_cases) {
    if (exp.tag != "vector") return;
    special_cases = special_cases || function (name, exp) {};
  
    var bindings = exp.list;

    if (bindings.length % 2 === 1) return;
    
    for (var i = 0; i < bindings.length; i += 2) {
      annotate_destructuring(bindings[i], scope);
      annotate_expressions(bindings[i + 1]);
      special_cases(bindings[i], bindings[i + 1]);
    }
  }

  function annotate_binding (exp) {
    var bindings = exp.list[1];

    if (bindings) {
      _annotate_binding_vector(bindings, exp.scope);
    }
    for (var i = 2; i < exp.list.length; i++) {
      annotate_expressions(exp.list[i]);
    }
  }
  
  function _annotate_metadata_recursive(meta) {
     annotate_expressions(meta);
    
    if (meta && meta.list) {
      for (var i = 0, j = meta.list.length; i < j; i++) {
        _annotate_metadata_recursive(meta.list[i]);
      }
    }    
    else {
      if (meta.value.match(/([A-Z].*\/)?[A-Z_]+/)) {
        meta.css = "color1 meta";
      }
      else {
        meta.css = (meta.css || meta.tag) + " meta";
      }   
    }
  }
  
  function annotate_metadata(exp) {
    if (!exp.meta) return;
    var meta = exp.meta;
    meta.meta_token.css = "preprocessor";
    
    _annotate_metadata_recursive(meta.attached_node);
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
          child.css = "comments";
        }
      }
      return exp;
    }
    
    ,["let", "binding", "doseq", "for", "domonad"], annotate_binding
  );
  
  function is_local(exp, name) {
    if (exp.scope && exp.scope[name]) return true;
    if (exp.parent) return is_local(exp.parent, name);
    return false;
  }

  function annotate_expressions(exp) {
    annotate_metadata(exp);
    
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


          // apply specific rules
          if (annotation_rules.hasOwnProperty(head.value)) {
            annotation_rules[head.value](exp);
          } 
          else {
            for (var i = 1; i < exp.list.length; i++) {
              annotate_expressions(exp.list[i]);
            }
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
        }
        else if (is_local(exp, exp.value)) {
          exp.tag = "variable";
        }
        break;
    
      case "keyword":
        exp.css = "constants";
        break;
    }
  }

  
  // create the new brush

  SH.brushes.Clojure = function () {};
  SH.brushes.Clojure.prototype = new SyntaxHighlighter.Highlighter();
  
  SH.brushes.Clojure.prototype.findMatches = function find_matches (regexpList, code) {
    console.profile();
    var tokens = tokenize(code);
    
    // seperate out interesting and uninteresting tokens; we want to highlight
    // comments and whitespace correctly but it just gets in the way of sexp processing
    var interesting = [];
    for (var i = 0, j = tokens.length; i < j; i++) {
      var token = tokens[i];
      if (!(token.tag === "whitespace"
            || token.tag === "comments"
            || token.tag === "invalid")) interesting[interesting.length] = token;
    }

    annotate_expressions(build_sexps(interesting));
    
    console.profileEnd();

    for (i = 0; i < j; i++) {
      var token = tokens[i];
      if (!token.css) {
        token.css = token.tag;
      }
    };
    
    return tokens;
  };
  
  SH.brushes.Clojure.aliases   = ['clojure', 'Clojure', 'clj'];

  return {};
})(SyntaxHighlighter);
