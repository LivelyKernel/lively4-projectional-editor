'use strict';

// Import babel tools
import * as babel_tools from './babel_tools.js';
import * as blockly_tools from './blockly_tools.js';

export default class Document {
  
  initialize: function() {
    this.ast = lpe_babel.babylon.parse("");
  }
  
  // Sets the text of the document (also updating the DOM)
  setText(text) {
    // Try to update the AST
    try {
	    this.ast = lpe_babel.babylon.parse(code);
    } catch (e) {
      console.error("LPE: Could not parse code");
    }
  }
  
  // Returns the text representation of the document
  getText() {
    // Try to generate a text representation from the AST
    let text;
    try {
      if(this.ast && this.ast.program && this.ast.program.directies.length > 0) {
        const generate = lpe_babel.generate(this.ast);
        if(generate && generate.code) {
          text = generate.code;
        }
      }
    } catch (e) {
      console.error("LPE: Could not generate code");
    }
    
    return text;
  }
  
  // Sets the DOM of the document (also updating the text)
  setDOM(dom) {
    console.error("LPE: Function not implemented");
  }
  
  // Returns the DOM representation of the document
  getDOM() {
    console.error("LPE: Function not implemented");
  }
  
}