'use strict';

// Load morph base class from core
import Morph from '../../lively4-core/templates/Morph.js';

// Import babel tools
import * as BabelTools from '../lib/babel_tools.js';
import * as BlocklyTools from '../lib/blockly_tools.js';

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
    
    // Create initial block
    //this.ast = lpe_babel.babylon.parse('');
    //this.updateBlockEditor();
  }

  // Injects and configures the block editor
  initBlockEditor() {
    // Inject Blockly
    this.blockWorkspace = Blockly.inject(this.blockEditor, {
      toolbox: BabelTools.getToolboxDefinition(),
      collapse: true,
      scrollbars: true,
      //trashcan: true,
      toolboxPosition: 'end', // Moves toolbox to the right
      horizontalLayout: true
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
        
        if(node && typeof(node.start) !== 'undefined' && typeof(node.end) !== 'undefined') {
          // Select the corresponding text in the text editor
          this.selectNodeInTextEditor(node);
        }
      }
      
      // If a block is moved, updated its connectors
      if(event.type === Blockly.Events.MOVE) {
        let block = this.blockWorkspace.getBlockById(event.blockId);
        if(block) {
          BlocklyTools.updateBlockConnections(block);
        }
      }
      
      // If a block is collapsed, set the placeholder text
      if(event.type === Blockly.Events.CHANGE && event.element === 'collapsed') {
        const block = this.blockWorkspace.getBlockById(event.blockId);
        this.fixSummaryTextOfBlock(block);
      }
    });
    
    
    // Add doubleclick listener to background for text entry
    const background = this.query('.blocklyMainBackground');
    background.addEventListener('dblclick', () => {
      const code = window.prompt('Code:');
      
      // Try to parse
      try {
        let partialAst = lpe_babel.babylon.parse(code);
        let blocks = BabelTools.createBlocksForAST(partialAst.program.body[0], this.blockWorkspace);
      } catch(e) {
        console.error('LPE: Could not transform text entry block');
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
        }, 1000);
        
        
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
      
      if(this.muteBlockEditor) {
        return;
      }
      
      // When fields are directly changed
      if(event.type === Blockly.Events.CHANGE && event.element === 'field') {
        this.registerUnsync();
        
        let block = this.blockWorkspace.getBlockById(event.blockId);
        let node = block.babel_node;
        
        // Change the value in the part of the AST that belongs to this block
        let oldValue = node[event.name];
        node[event.name] = event.newValue;
        
        if(this.query('#smartRenamingBox').checked) {
          // If the node is an Identifier, also change all other identifiers
          if(node.type === 'Identifier') {
            let changeIdentifier = (node, oldValue, newValue) => {
              // Update AST value and block text
              if(node.type && node.type === 'Identifier' && node[event.name] === oldValue) {
                node[event.name] = newValue;
                node.blockly_block.getInput(event.name).fieldRow[1].setValue(newValue);
                this.fixSummaryTextOfBlock(node.blockly_block);
              }
              for(let key in node) {
                // Avoid cycles
                if(key === 'blockly_block' || key === 'next') {
                  continue;
                }
                
                if(node[key] instanceof Array && node[key].length > 0) {
                  for(let i = 0; i < node[key].length; i++) {
                    changeIdentifier(node[key][i], oldValue, newValue);
                  }
                } else if(node[key] instanceof Object) {
                  changeIdentifier(node[key], oldValue, newValue);
                }
              }
            }
            
            // Find the node at which we have to start renaming
            const stopTypes = [
              'ForStatement',
              'WhileStatement',
              'DoWhileStatement',
              'FunctionExpression',
              'FunctionDeclaration',
              'BlockStatement',
              'Program'
            ];
            
            const outerStopTypes = [
              'ForStatement',
              'WhileStatement',
              'DoWhileStatement',
              'FunctionExpression',
              'FunctionDeclaration'
            ];
            
            // Find the first parent that is of stopType
            let originalNode = node;
            while(node && node.type && stopTypes.indexOf(node.type) === -1) {
              let parentBlock = node.blockly_block.getSurroundParent();
              if(parentBlock) {
                node = parentBlock.babel_node;
              } else {
                node = null;
              }
            }
            
            if(node !== null) {
              // If the found parent is a block, check if it was preceded by another stopType
              let parentBlock = node.blockly_block.getSurroundParent();
              if(node.type === 'BlockStatement' && parentBlock && outerStopTypes.indexOf(parentBlock.babel_node.type) !== -1)  {
                node = parentBlock.babel_node;
              }
            } else  {
              node = originalNode;
            }
            
            // Rename other Identifiers
            changeIdentifier(node, oldValue, event.newValue);
          }
        }
        
        try {
          // Update the text editor
          this.updateTextEditor();
          
          // Select the corresponding text in the text editor
          this.selectNodeInTextEditor(node);
          
          this.registerSync();
        } catch (e) {
          console.error("LPE: Could not update text editor");
          this.registerError();
        }
      }
      
      // When a block is dragged around
      if(event.type === Blockly.Events.MOVE) {
        console.log(event);
        let block = this.blockWorkspace.getBlockById(event.blockId);
        if(block) {
          
          let node = block.babel_node;
          
          // Block parent was changed
          if(event.oldParentId != event.newParentId) {
            
            // Block was removed
            if(!event.newParentId) {
              console.log(event);
              let oldParentBlock = this.blockWorkspace.getBlockById(event.oldParentId);
              
              let oldInput;
              if(event.oldInputName) {
                oldInput = oldParentBlock.babel_node[event.oldInputName];
              } else  {
                oldInput = this.getParentInputOfBlock(oldParentBlock);
              }

              if(oldInput && oldInput.constructor == Array) {
                const blockAstIndex = oldInput.indexOf(block.babel_node);
                //console.log("Found in AST at index " + blockAstIndex);
                oldInput.splice(blockAstIndex);
              } else {
                oldParentBlock.babel_node[event.oldInputName] = undefined;
              }
              
              try {
                // Update the text editor
                this.updateTextEditor();
                
                // Select the corresponding text in the text editor
                this.selectNodeInTextEditor(node);
                
                this.registerSync();
              } catch (e) {
                console.error("LPE: Could not update text editor");
                this.registerError();
              }
            }
            
            // Block was added
            if(!event.oldParentId) {
              
              let newParentBlock = this.blockWorkspace.getBlockById(event.newParentId);
              
              // Check if it was added to an input or a chain
              let newInput;
              if(event.newInputName) {
                // It was added directly to the input - use the input
                newInput = newParentBlock.babel_node[event.newInputName];
              } else {
                newInput = this.getParentInputOfBlock(block);
              }
              
              if(newInput && newInput.constructor === Array) {
                // Check if the moved block has a successor (AFTER moving!)
                let nextBlock = block.getNextBlock();
                if(!nextBlock) {
                  // No successor - just push the node
                  newInput.push(block.babel_node);
                } else {
                  // We have a successor
                  // Find all successors to add successors
                  let nextBlockIndex;
                  let currentBlock = block;
                  let blocksToInsert = [];
                  do {
                    blocksToInsert.push(currentBlock.babel_node);
                    currentBlock = currentBlock.getNextBlock();
                    if(currentBlock) {
                      nextBlockIndex = newInput.indexOf(currentBlock.babel_node);
                    }
                  } while(currentBlock && nextBlockIndex == -1);
                  
                  // Add all newly moved in blocks
                  if(nextBlockIndex != -1) {
                    while(blocksToInsert.length != 0) {
                      let blockToInsert = blocksToInsert.pop();
                      newInput.splice(nextBlockIndex, 0, blockToInsert);
                    }
                  } else {
                    for(let i = 0; i < blocksToInsert.length; i++) {
                      newInput.push(blocksToInsert[i]);
                    }
                  }
                  
                }
              } else {
                let newInputName;
                if(event.newInputName) {
                  newInputName = event.newInputName;
                } else {
                  newInputName = this.getParentInputNameOfBlock(block);
                }
                
                newParentBlock.babel_node[newInputName] = block.babel_node;
              }
              
              try {
                // Update the text editor
                this.updateTextEditor();
                
                // Select the corresponding text in the text editor
                this.selectNodeInTextEditor(node);
                
                this.registerSync();
              } catch (e) {
                console.error("LPE: Could not update text editor");
                this.registerError();
              }
            }
          }
        }
      }
      
      // When a new block is created
      if(event.type === Blockly.Events.CREATE) {
        
        console.log(event);
        
        // Create the block
        let block = this.blockWorkspace.getBlockById(event.blockId);
        
        // Create the babel node
        block.babel_node = BabelTools.createNodeOfType(block.type);
        block.babel_node.blockly_block = block;
      }
    });
  }
  
  // Gets the input of the parent to which a block is (directly or indirectly) connected
  getParentInputOfBlock(block) {
    let inputName = this.getParentInputNameOfBlock(block);
    let input = block.getSurroundParent().babel_node[inputName];
    
    return input;
  }
  
  // Gets the input name of the parent to which a block is (directly or indirectly) connected
  getParentInputNameOfBlock(block) {
    let firstBlockOfChain = block;
    while(firstBlockOfChain.getParent().id != block.getSurroundParent().id) {
      firstBlockOfChain = firstBlockOfChain.getParent();
    }
    
    let inputName = block.getSurroundParent().getInputWithBlock(firstBlockOfChain).name
    
    return inputName;
  }

  // Updates the block editor
  updateBlockEditor() {
    
    //this.muteBlockEditor = true;
    this.blockWorkspace.clear();
    
    BabelTools.createBlocksForAST(this.ast, this.blockWorkspace);
    //this.muteBlockEditor = false;
    this.collapseBlocks();
  }

  // Updates the text editor
  updateTextEditor() {
    // Generate AST
    let generated = lpe_babel.generate(this.ast, {
      retainFunctionParens: true
    }/*, this.textEditor.value*/);

    // Set value in text editor
    this.muteTextEditor = true;
    this.textEditor.value = generated.code;
    setTimeout(() => {
      this.muteTextEditor = false;
    }, 1000);
    
    this.fixCodeLocations();
  }
  
  // Fixes the location-related fields in the AST without completely updating it
  fixCodeLocations() {
    let newAst = lpe_babel.babylon.parse(this.textEditor.value);
    
    let fixNode = (newNode, node) => {
      // Update location
      if(typeof(newNode.start) !== 'undefined') {
        node.start = newNode.start;
      }
      
      if(typeof(newNode.end) !== 'undefined') {
        node.end = newNode.end;
      }
      
      if(typeof(newNode.loc) !== 'undefined') {
        node.loc = newNode.loc;
      }
      
      // Also update summary text
      if(node.blockly_block) {
        this.fixSummaryTextOfBlock(node.blockly_block);
      }
      
      // Recursively traverse tree
      if(newNode.type === 'File') {
        fixNode(newNode.program, node.program)
      } else {
        for(let key in newNode) {
          if(newNode[key] instanceof Array && node[key] instanceof Array
             && newNode[key].length == node[key].length) {
            for(let i = 0; i < newNode[key].length; i++) {
              fixNode(newNode[key][i], node[key][i]);
            }
          } else if(newNode[key] && newNode[key].type
                    && node[key] && node[key].type) {
            fixNode(newNode[key], node[key]);
          }
        }
      }
      
    }
    
    fixNode(newAst, this.ast);
  }
  
  // Updates the summary of a block
  fixSummaryTextOfBlock(block) {
    if(block.isCollapsed()) {
      const text = this.textEditor.value.substring(block.babel_node.start, block.babel_node.end);
      block.getInput('_TEMP_COLLAPSED_INPUT').fieldRow[0].setText(text);
    }
  }
  
  // Collapses all blocks (probably needs some smart strategy in the future)
  collapseBlocks() {
    this.blockWorkspace.getAllBlocks().map((block) => {
      if(block.type !== 'babel_Program') {
        block.setCollapsed(true);
      }
    });
  }
  
  // Selects the code for the given node in the text editor
  selectNodeInTextEditor(node) {
    const Range = ace.require("ace/range").Range;
    if(node.loc) {
      const nodeRange = new Range(node.loc.start.line-1, node.loc.start.column, node.loc.end.line-1, node.loc.end.column);
      this.textEditor.editor.getSelection().setRange(nodeRange);
    }
  }
  
  registerSync() {
    this.query('.statusicon').style.backgroundColor = 'green';
  }
  
  registerUnsync() {
    this.query('.statusicon').style.backgroundColor = 'yellow';
  }
  
  registerError() {
    this.query('.statusicon').style.backgroundColor = 'red';
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
