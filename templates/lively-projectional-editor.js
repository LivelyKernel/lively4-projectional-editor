'use strict';

// Load morph base class from core
import Morph from '../../lively4-core/templates/Morph.js';

// Projectional Editor class
export default class ProjectionalEditor extends Morph {
  
  // Called to initialize the component
  initialize() {
    //debugger;
    
    // Set title
    this.windowTitle = "Projectional Editor"
    
    // Get the views
    this.textView = this.query('#textView');
    this.blockView = this.query('#blockView');
    
    // Bind the two views to each other
    this.bindViews();
  }
  
  bindViews() {
    this.textView.addEventListener('change', (evt) => {
      this.blockView.value = this.textView.value;
    })
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
