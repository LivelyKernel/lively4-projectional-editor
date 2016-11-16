'use strict';

// Load morph base class from core
import Morph from '../../lively4-core/templates/Morph.js';

// Import babel tools
import * as babel_tools from '../lib/babel_tools';

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
    setTimeout(() => {
      this.initBlockEditor();
    }, 1000);
    
    
    // Bind the two views to each other
    //this.bindViews();
  }
  
  // Binds the content of the text- and block views
  bindViews() {
    this.textEditor.addEventListener('change', (evt) => {
      this.blockEditor.value = this.textEditor.value;
    })
  }
  
  buildToolbox() {
    return '<xml><block type="controls_if"></block><block type="controls_whileUntil"></block></xml>';
  }
  
  // Injects and configures
  initBlockEditor() {
    // Inject Blockly
    this.blockWorkspace = Blockly.inject(this.blockEditor, {
      toolbox: this.buildToolbox(),
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
