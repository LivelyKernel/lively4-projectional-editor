'use strict';

// Load morph base class from core
import Morph from '../../lively4-core/templates/Morph.js';

// Import babel tools
import * as babel_tools from '../lib/babel_tools.js';
import * as blockly_tools from '../lib/blockly_tools.js';

// Projectional Editor class
export default class ProjectionalEditor extends Morph {
  
  // Called to initialize the component
  initialize() {
    //debugger;
    
    // Set title
    this.windowTitle = "Projectional Editor"
    
    // Set default size
    this.parentElement.setSize(800, 600);
    
    // Get the views
    this.textEditor = this.query('#textEditor');
    this.blockEditor = this.query('#blockEditor');
    
    // Initialize the block editor
    this.initBlockEditor();
    
    // Bind the two editors to each other
    this.bindEditors();
  }

  // Injects and configures the block editor
  initBlockEditor() {
    // Inject Blockly
    this.blockWorkspace = Blockly.inject(this.blockEditor, {
      toolbox: babel_tools.getToolboxDefinition(),
      collapse: true,
      scrollbars: true,
      toolboxPosition: 'end' // Moves toolbox to the right
    });
    
    // There is (currently) no resize event on the window
    // So we regularly check the size and redraw the svg if needed
    let oldSize = {
      width: this.blockEditor.clientWidth,
      height: this.blockEditor.clientHeight
    };
    
    let interval = setInterval(()=>{
      let newSize = {
        width: this.blockEditor.clientWidth,
        height: this.blockEditor.clientHeight
      };
      
      if(newSize.width !== oldSize.width || newSize.height !== oldSize.height) {
        Blockly.svgResize(this.blockWorkspace);
        oldSize = newSize;
      }
    }, 2000);
    
    // Listen for changes on the Blockly workspace
    var lastClickedBlock = '';
    var lastClickedTime = (new Date()).getTime();
    this.blockWorkspace.addChangeListener((event) => {

      // If a block is moved, updated its connectors
      if(event.type === Blockly.Events.MOVE) {
        let block = this.blockWorkspace.getBlockById(event.blockId);
        if(block) {
          blockly_tools.updateBlockConnections(block);
        }
      }

      // Collapse a block on double click
      if(event.type === Blockly.Events.UI && event.element === 'click') {
        const newTime = (new Date()).getTime();
        if(lastClickedBlock === event.blockId && (newTime - lastClickedTime) < 1000) {
          const clickedBlock = this.blockWorkspace.getBlockById(event.blockId);
          clickedBlock.setCollapsed(!clickedBlock.isCollapsed());
          
          lastClickedBlock = '';
          lastClickedTime = 0;
        } else {
          lastClickedBlock = event.blockId;
          lastClickedTime = newTime;
        }
      }

      // If a block is selected, select the corresponding text in the text editor
      if(event.type === Blockly.Events.UI && event.element === 'selected') {
        if(!event.newValue) {
          return;
        }
        
        let block = this.blockWorkspace.getBlockById(event.newValue);
        let node = block.babel_node;
        
        if(typeof(node.start) !== 'undefined' && typeof(node.end) !== 'undefined') {
          // Select the corresponding text in the text editor
          this.selectTextRange(this.textEditor.value, node.start, node.end);
        }
      }
    });
  }
  
  // Binds the content of the text- and block views
  bindEditors() {
    // Initialize mute variable
    this.muteTextEditor = false;
    this.muteBlockEditor = false;
    
    // Update block editor when the text editor changes
    let timeout;
    this.textEditor.addEventListener('change', (evt) => {
      if(this.muteTextEditor) {
        return;
      }
      
      this.registerUnsync();
      
      // Cancel the old timeout
      if(timeout) {
        clearTimeout(timeout);
      }
      
      // Start a new timeout
      timeout = setTimeout(() => {
        // Mute the change events from the block view
        this.muteBlockEditor = true;
        setTimeout(() => {
          this.muteBlockEditor = false;
        }, 2000);
        
        
        // If the content hasn't changed for 1 second, update the block view
        try {
          // Create new AST
      	  this.ast = lpe_babel.babylon.parse(this.textEditor.value);
      	  
      	  // Update Block editor
          this.updateBlockEditor();
          
          // Show sync status
          this.registerSync();
        } catch (e) {
          console.error("LPE: Could not parse code");
          this.registerError();
        }
        
      }, 1000);
    });

    // Update text editor when block editor changes
    this.blockWorkspace.addChangeListener((event) => {
      // When values are directly changed
      if(event.type === Blockly.Events.CHANGE) {
        if(!this.muteBlockEditor) {
          this.registerUnsync();
          
          let block = this.blockWorkspace.getBlockById(event.blockId);
          let node = block.babel_node;
          
          // Change the value in the part of the AST that belongs to this block
          node[event.name] = event.newValue;
          
          try {
            // Update the text editor
            this.updateTextEditor();
            
            // Select the corresponding text in the text editor
            this.selectTextRange(this.textEditor.value, node.start, node.end);
            
            this.registerSync();
          } catch (e) {
            console.error("LPE: Could not update text editor");
            this.registerError();
          }
        }
      }
    });
  }

  // Updates the block editor
  updateBlockEditor() {
    this.blockWorkspace.clear();
    babel_tools.createBlocksForAST(this.ast, this.blockWorkspace);
  }

  // Updates the text editor
  updateTextEditor() {
    // Generate AST
    let generated = lpe_babel.generate(this.ast);

    // Set value in text editor
    this.textEditor.value = generated.code;
  }
  
  // Turns an absolute position in a text into a row and column position
  getLineAndColumnForPosition(text, pos) {
    let line = 0;
    let col = 0;
    for(let i = 0; i < pos; i++) {
      col++;
      if(text[i] == '\n') {
        line++;
        col = 0;
      }
    }
    
    return [line, col];
  }
  
  // Selects a range of text in the text editor
  selectTextRange(text, start, end) {
    const Range = ace.require("ace/range").Range;
    const rangeStart = this.getLineAndColumnForPosition(text, start);
    const rangeEnd = this.getLineAndColumnForPosition(text, end);
    this.textEditor.editor.getSelection().setRange(new Range(rangeStart[0], rangeStart[1], rangeEnd[0], rangeEnd[1]));
  }
  
  registerSync() {
    this.query('.statusbar').style.backgroundColor = 'green';
  }
  
  registerUnsync() {
    this.query('.statusbar').style.backgroundColor = 'yellow';
  }
  
  registerError() {
    this.query('.statusbar').style.backgroundColor = 'red';
  }

  // Utility function to get a part of the component
  query(selector) {
    return this.shadowRoot.querySelector(selector)
  }

  // Utility function to get multiple parts of the component  
  queryAll(selector) {
    return this.shadowRoot.querySelectorAll(selector)
  }
}
