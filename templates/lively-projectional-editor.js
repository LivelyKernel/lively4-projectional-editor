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
    
    // Bind the two views to each other
    this.bindViews();
  }
  
  // Binds the content of the text- and block views
  bindViews() {
    // Update block view when the text view changes
    let timeout;
    this.textEditor.addEventListener('change', (evt) => {
      // Cancel the old timeout
      if(timeout) {
        clearTimeout(timeout);
      }
      
      // Start a new timeout
      timeout = setTimeout(() => {
        // If the content hasn't changed for 1 second, update the block view
        this.blockWorkspace.clear();
        babel_tools.createBlocksForCode(this.textEditor.value, this.blockWorkspace);
      }, 1000);
    })
  }
  
  // Injects and configures
  initBlockEditor() {
    // Inject Blockly
    this.blockWorkspace = Blockly.inject(this.blockEditor, {
      toolbox: babel_tools.getToolboxDefinition(),
      collapse: true,
      scrollbars: true
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
    this.blockWorkspace.addChangeListener((event) => {
      if(event.type === Blockly.Events.MOVE) {
        let block = this.blockWorkspace.getBlockById(event.blockId);
        if(block) {
          blockly_tools.updateBlockConnections(block);
        }
      }
    });
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
