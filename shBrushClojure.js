// (inc closjure-brush) ;; an improved SyntaxHighlighter brush for clojure
//
// https://github.com/brehaut/inc-clojure-brush
//
// Written by Andrew Brehaut
// V0.1, November 2011

if (typeof net == "undefined") net = {};
if (!(net.brehaut)) net.brehaut = {};

net.brehaut.ClojureTools = (function (SH) {
  "use strict";
  // utiliies
  function object(o) {
    function F() {};
    F.prototype = o;  
    return new F();
  }
        
  // data
  
  function Token(value, index, tag, length) {
    this.value = value;
    this.index = index;
    this.length = length || value.length;
    this.tag = tag;
  }
  
  // null_token exists so that LispNodes that have not had a closing tag attached
  // can have a dummy token to simplify annotation
  var null_token = new Token("", -1, "null", -1);
  
  /* LispNodes are aggregate nodes for sexpressions. 
   *
   */
  function LispNode(tag, children, opening, closing) {
    this.tag = tag;            // current metadata for syntax inference
    this.parent = null;        // the parent expression
    this.list = children;      // all the child forms in order
    this.opening = opening;    // the token that opens this form.
    this.closing = null_token; // the token that closes this form.
    this.meta = null;          // metadata nodes will be attached here if they are found
    this.scope = {};           // any binding forms may insert names into here for locals lookup

  }
  LispNode.prototype = { 
    toString: function () {
      return this.opening.value + this.list.join(",") + (this.closing ? this.closing.value : ""); 
    }
  }
  
  function PrefixNode(tag, token, attached_node) {
    this.tag = tag;
    this.token = token;
    this.attached_node = attached_node;
    this.parent = null;
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
        // todo: exponents, hex
        // http://my.safaribooksonline.com/9781449310387/14?reader=pf&readerfullscreen=&readerleftmenu=1
          var c2 = code[i + 1];
          if (((c === "+" || c === "-") && c2.match(/[0-9]/)) // prefixes
              || (c !== "+" && c !== "-")) {
            if (c === "+" || c === "-") extent++; 
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


  function build_tree(tokens) {
    var toplevel = {
      list: [], 
      tag: "toplevel", 
      parent: null, 
      opening: null,
      closing: null,
      depth: -1
    };
    
    // loop variables hoisted out as semi globals to track position in token stream
    var i = -1;
    var j = tokens.length;
    
    function parse_one(t) {
      // ignore special tokens and forms that dont belong in the tree
      for (; (t.tag === "comments" || t.tag === "invalid" || t.tag == "skip") && i < j; ) {
        if (t.tag === "skip") {
          t.tag = "preprocessor";
          annotate_comment(parse_one(tokens[++i]));
        }
        t = tokens[++i];
      }

      switch (t.tag) {
        case "{":
          return build_aggregate(new LispNode("map", [], t), "}");
        case "(":
          return build_aggregate(new LispNode("list", [], t), ")");
        case "#{":
          return build_aggregate(new LispNode("set", [], t), "}");
        case "[":
          return build_aggregate(new LispNode("vector", [], t), "]");
        case "'":
          return new PrefixNode("quote", t, parse_one(tokens[++i]));
        case "#'":
          return new PrefixNode("varquote", t, parse_one(tokens[++i]));  
        case "@":
          return new PrefixNode("deref", t, parse_one(tokens[++i]));  
        case "`":
          return new PrefixNode("quasiquote", t, parse_one(tokens[++i]));  
        case "^":
          t.tag = "meta";
          var meta = parse_one(tokens[++i]);
          var next = parse_one(tokens[++i]);
          next.meta = meta;
          return next;
      }
      
      return t;
    }
    
    // build_aggregate collects to ether sub forms for one aggregate for. 
    function build_aggregate(current, expected_closing) {
      for (i++; i < j; i++) {
        var t = tokens[i];

        if (t.tag === "}" || t.tag === ")" || t.tag === "]") {
          if (t.tag !== expected_closing) t.tag = "invalid";
          current.closing = t;
          if (expected_closing) return current;
        }
        var node = parse_one(t);

        node.parent = current;
        current.list[current.list.length] = node;
      }
      
      return current;
    }
    
    build_aggregate(toplevel, null);
    
    return toplevel;
  }

  // annotation rules to apply to a form based on its head

  /* annotate_comment is a special case annotation. 
   * in addition to its role in styling specific forms, it is called by parse_one to
   * ignore any forms skipped with #_
   */ 
  function annotate_comment(exp) {
    exp.tag = "comments";
    if (exp.list) {
      exp.opening.tag = "comments";
      exp.closing.tag = "comments";
    
      for (var i = 0; i < exp.list.length; i++) {
        var child = exp.list[i];
        if (child.list) {
          annotate_comment(child);
        }
        else {
          child.tag = "comments";
        }
      }
    }
  }

  /* custom annotation rules are stored here */
  var annotation_rules = {}
  
  // this function is exposed to allow ad hoc extension of the customisation rules
  function register_annotation_rule(names, rule) {
    for (var i = 0; i < names.length; i+=2) {
      annotation_rules[names[i]] = rule;
    }
  }


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
          annotate_expressions(exp.list[i + 1]);
        } 
      }
    } 
    else if (exp.tag === "symbol"){
      exp.tag = "variable";
      scope[exp.value] = true;
    }
  }

  function annotate_arguments (exp) {
  }

  function _annotate_binding_vector (exp, scope, special_cases) {
    if (exp.tag != "vector") return;
  
    var bindings = exp.list;

    if (bindings.length % 2 === 1) return;
    
    if (special_cases) {
      for (var i = 0; i < bindings.length; i += 2) {
        annotate_destructuring(bindings[i], scope);
        annotate_expressions(bindings[i + 1]);
        special_cases(bindings[i], bindings[i + 1]);
      }
    } 
    else {
      for (var i = 0; i < bindings.length; i += 2) {
        annotate_destructuring(bindings[i], scope);
        annotate_expressions(bindings[i + 1]);
      }
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
  


  

  register_annotation_rule(
    ["comment"],
    annotate_comment
  );
  
  register_annotation_rule(
    ["let", "binding", "doseq", "for"],
    annotate_binding
  );
  
  function is_local(exp, name) {
    if (exp.scope && exp.scope[name]) return true;
    if (exp.parent) return is_local(exp.parent, name);
    return false;
  }

  // standard annotations

  function _annotate_metadata_recursive(meta) {
     annotate_expressions(meta);
    
    if (meta && meta.list) {
      for (var i = 0, j = meta.list.length; i < j; i++) {
        meta.opening.css = "meta"
        if (meta.closing) meta.closing.css = "meta";
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
    if (!(exp && exp.meta)) return;
    var meta = exp.meta;
    
    _annotate_metadata_recursive(meta);
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
        var head = exp.list[0];
      
        if (head) {
          if (head.tag === "list" || head.tag === "vector" 
           || head.tag === "map" || head.tag === "set") {
            annotate_expressions(head);
          }
          else {
            head.tag = (head.value.match(/(^\.)|(\.$)|[A-Z].*\//)
                        ? "method"
                        : "functions");
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
          exp.opening.tag = "value";
          exp.closing.tag = "value";
        }
      
        break;
      
      case "vector": // data
      case "map":
      case "set":
        exp.opening.tag = "value";
        exp.closing.tag = "value";
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
        exp.tag = "constants";
        break;
    }
  }

  
  // create the new brush

  SH.brushes.Clojure = function () {};
  SH.brushes.Clojure.prototype = new SyntaxHighlighter.Highlighter();
  
  SH.brushes.Clojure.prototype.findMatches = function find_matches (regexpList, code) {
    console.profile();
    var tokens = tokenize(code);
    
    annotate_expressions(build_tree(tokens));
    
    for (var i = 0, j = tokens.length; i < j; i++) {
      var token = tokens[i];
      if (!token.css) {
        token.css = token.tag;
      }
    };
    
    console.profileEnd();
    
    return tokens;
  };
  
  SH.brushes.Clojure.aliases = ['clojure', 'Clojure', 'clj'];
  SH.brushes.Clojure.register_annotation_rule = register_annotation_rule;

  return {
    tokenize: tokenize,
    build_tree: build_tree
  };
})(SyntaxHighlighter);
