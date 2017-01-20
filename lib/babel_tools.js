import * as blockly_tools from "./blockly_tools.js";

const TYPE_PREFIX = "babel_";

const categories = {
  Other: 0,
  Expression: 60,
  Statement: 90,
  Declaration: 120,
  Literal: 150,
  Identifier: 250
}


// Gets the color for a specific node name
function getColorForNodeName (nodeName) {
  if(nodeName === 'textEntry') {
    return 300;
  }
  
  for(var category in categories) {
    if(nodeName.indexOf(category, nodeName.length - category.length) !== -1) {
      return categories[category];
    }
  }
  
  return 0;
}

// Gets the category for a specific node name
function getCategoryForNodeName(nodeName) {
  for(var category in categories) {
    if(nodeName.indexOf(category, nodeName.length - category.length) !== -1) {
      return category;
    }
  }
  
  return "Other";
}


// Set some hardcoded validator properties to use later
function initHardcodedValidators() {
  // MemverExpression.property can either be an expression or an identifier
  // This depends on the context and is not visible in NODE_FIELDS
  // So we hardcode it for now
  lpe_babel.types.NODE_FIELDS.MemberExpression.property.validate.oneOfNodeTypes = [
    "Expression",
    "Identifier"
  ];
}


// Gets the block definition for a node
function blockDefinitionFromNode(node, nodetype) {
	return {
		init: function() {

			// Always add one input with the title
			this.appendDummyInput()
				.appendField(nodetype);

			// Default settings
			this.setColour(getColorForNodeName(nodetype));
			this.lpe_aliases = lpe_babel.types.ALIAS_KEYS[nodetype];
			
			blockly_tools.updateBlockConnections(this);
			//this.setInputsInline(true);

			// Catch literals (they don't have inputs)
			if(typeof(node) === 'undefined' || node.value) {
				const field_name = 'value';
				this.appendDummyInput(field_name)
					.appendField(field_name)
					.appendField(new Blockly.FieldTextInput(""), field_name);
			} else {
				// Go through the inputs
				for(const field_name in node) {
					const field = node[field_name];

					// Check if this is a chaining input
					if(!field.validate) {
						//console.log("Error: field can't be validated:");
						//console.log(field);
						return {};
					}

					if(field.validate.chainOf) {

						// Decide if this is a series of nodes or a limited selection of nodes
						if(field.validate.chainOf[0].type === 'array') {
							// This is a series of nodes
							this.appendStatementInput(field_name)
								.setCheck(null)
								.appendField(field_name);
						} else {
							// This is a list of possible values
							// Create a properly formatted list
							var possible_values = field.validate.chainOf[1].oneOf.map((value) => {
								return [value, value];
							});
							this.appendDummyInput()
								.appendField(new Blockly.FieldDropdown(possible_values), field_name);

						}
						
					} else if (field.validate.oneOfNodeTypes) {
						this.appendValueInput(field_name)
							.setCheck(/*field.validate.oneOfNodeTypes*/null)
							.appendField(field_name);
					} else if (field.validate.type && field.validate.type !== 'string') {
						this.appendValueInput(field_name)
							.setCheck(/*field.validate.type*/null)
							.appendField(field_name);
					} else {
						this.appendDummyInput(field_name)
							.appendField(field_name)
							.appendField(new Blockly.FieldTextInput(""), field_name);
					}
				}
			}
		}
	}
}


// Gets the block defintion for a node type
function blockDefinitionForNodeType(nodetype) {
	return blockDefinitionFromNode(lpe_babel.types.NODE_FIELDS[nodetype], nodetype)
}


// Creates a node of a given type
function createNodeOfType(nodeType) {
  // Sanitize nodeType
  if(nodeType.indexOf("babel_") === 0) {
    nodeType = nodeType.substring("babel_".length, nodeType.length);
  }
  
  // Prepare node
  let node = {
    type: nodeType
  }
  
  // Get required keys
  let nodeFields = lpe_babel.types.NODE_FIELDS[nodeType];
  
  // Insert empty keys for fields
  for(const fieldName in nodeFields) {
    const field = nodeFields[fieldName];
    
    if(!field.validate) {
      continue;
    }
    
    if(field.validate.chainOf) {
      node[fieldName] = [];
      if(field.validate.chainOf[0].type !== 'array') {
        node[fieldName] = field.validate.chainOf[1].oneOf[0];
      }
		} else {
			node[fieldName] = null;
		}
  }
  
  return node;
}


// Creates all blocks for a given AST
function createBlocksForAST(ast, workspace) {
	const parse_node = (node) => {
		
		const node_meta = lpe_babel.types.NODE_FIELDS[node.type];
		
		let block = workspace.newBlock(TYPE_PREFIX + node.type);
		block.babel_node = node;
		node.blockly_block = block;
		
		block.initSvg();
		block.render();

		if(typeof node_meta.value !== 'undefined') {
			block.getField("value").setValue(node.value);
		} else {
			// Go through the inputs
			for(const field_name in node_meta) {
				const field_meta = node_meta[field_name];

				// Check if this is a chaining input
				if(!field_meta.validate) {
					console.log("Error: field can't be validated:");
					console.log(field_meta);
					continue;
				}

				if(field_meta.validate.chainOf) {

					// Decide if this is a series of nodes or a limited selection of nodes
					if(field_meta.validate.chainOf[0].type === 'array') {
	
						let node_list = node[field_name];

						if(node_list && node_list.length > 0) {
							// Transform list to tree
							for(let i = node_list.length-1; i > 0; i--) {
								node_list[i-1].next = node_list[i];
								//node_list.pop();
							}

							blockly_tools.setAsFirstStatement(parse_node(node_list[0]), block, field_name);
						}

					} else {
						block.getField(field_name).setValue(node[field_name]);
					}
					
					//console.log(field.validate.chainOf)
				} else if (field_meta.validate.oneOfNodeTypes) {
				  if(node[field_name]) {
					  blockly_tools.setAsInput(parse_node(node[field_name]), block, field_name)
				  }
				} else if (field_meta.validate.type && field_meta.validate.type !== 'string') {
					if(node[field_name]) {
					  blockly_tools.setAsInput(parse_node(node[field_name]), block, field_name)
				  }
				} else {
					block.getField(field_name).setValue(node[field_name]);
				}
			}
		}

		if(node.next) {
			blockly_tools.setAsNext(parse_node(node.next), block)
		}
    
		return block;
	}
	
	if(ast.program) {
	  return parse_node(ast.program);
	} else if(ast instanceof Array) {
	  let parsedNodes = ast.map(parse_node);
	  return parsedNodes;
	} else {
	  return parse_node(ast);
	}
	
}


// Creates all blocks for a given code
function createBlocksForCode(code, workspace) {
  try {
	  const ast = lpe_babel.babylon.parse(code);
	  createBlocksForAST(ast, workspace);
  } catch (e) {
    console.error("LPE: Could not parse code");
    workspace.clear();
  }
}

// Returns the XML definition of the toolbox
function getToolboxDefinition() {
  initHardcodedValidators();
  
  const test_types = [
    'Program',
    'VariableDeclaration',
    'VariableDeclarator',
    'Identifier',
    'NumericLiteral',
    'StringLiteral',
    'NullLiteral',
    'Literal',
    'BinaryExpression',
    'CallExpression',
    'MemberExpression',
    'ExpressionStatement',
    'BlockStatement',
    'FunctionDeclaration',
    'IfStatement',
    'AssignmentExpression',
    'ForStatement',
    'UpdateExpression',
    'WhileStatement',
    'DoWhileStatement',
    'ReturnStatement',
    'ArrayExpression',
    'ClassDeclaration',
    'ClassBody',
    'MethodDefinition',
    'FunctionExpression',
    'ClassMethod'
  ];
  
  var toolbox = '<xml>';
  
  //for(var category in categories) {
    //var categoryXml = "<category name=\"" + category + "\">";
    //var categoryXml = '<category name="Babel">';
    //var categoryXml = '<category name="test">';
    var categoryXml = '';
    
    for(var i = 0; i < test_types.length; i++) {
      const type = test_types[i];
      //if(getCategoryForNodeName(type) === category) {
        const type_name = 'babel_' + type;
        Blockly.Blocks[type_name] = blockDefinitionForNodeType(type);
        categoryXml += '  <block type="' + type_name + '"></block>';
      //}
    }
    
    //categoryXml += "</category>";
    toolbox += categoryXml;
    //toolbox += '<category name="Variables" colour="330" custom="VARIABLE"></category><category name="Functions" colour="290" custom="PROCEDURE"></category>';
  //}
  
  toolbox += '</xml>';
  
  return toolbox;
}


// Export public functions
export {
	blockDefinitionFromNode,
	blockDefinitionForNodeType,
	createBlocksForAST,
	createBlocksForCode,
	getToolboxDefinition,
	createNodeOfType
};