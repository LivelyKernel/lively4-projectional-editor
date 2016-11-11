import * as bt from "../lively4-projectional-editor/blockly-tools.js";

const TYPE_PREFIX = "babel_";

const colors = {
	Program: 0,
	Identifier: 250,
	NumericLiteral: 150,
	StringLiteral: 150,
	Literal: 150,
	BinaryExpression: 60,
}

const blockDefinitionFromNode = (node, nodetype) => {
	return {
		init: function() {

			// Get a local Blockly reference
			let Blockly = lpe_lib.blockly;

			// Always add one input with the title
			this.appendDummyInput()
				.appendField(nodetype);

			// Default settings
			if(typeof(colors[nodetype]) !== 'undefined') {
				this.setColour(colors[nodetype]);
			} else {
				this.setColour(20);
			}
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setOutput(true, null);
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
						
						//console.log(field.validate.chainOf)
					} else if (field.validate.oneOfNodeTypes) {
						this.appendValueInput(field_name)
							.setCheck(null)
							.appendField(field_name);
					} else if (field.validate.type) {
						this.appendValueInput(field_name)
							.setCheck(null)
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

const blockDefinitionForNodeType = (nodetype) => {
	return blockDefinitionFromNode(lpe_lib.types.NODE_FIELDS[nodetype], nodetype)
}

const createBlocksForAST = (ast, workspace) => {
	const parse_node = (node) => {
		
		const node_meta = lpe_lib.types.NODE_FIELDS[node.type];
		
		let block = workspace.newBlock(TYPE_PREFIX + node.type);
		block.babel_node = node;		
		
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
								node_list.pop();
							}

							bt.setAsFirstStatement(parse_node(node_list[0]), block, field_name);
						}

					} else {
						block.getField(field_name).setValue(node[field_name]);
					}
					
					//console.log(field.validate.chainOf)
				} else if (field_meta.validate.oneOfNodeTypes) {
					bt.setAsInput(parse_node(node[field_name]), block, field_name)
				} else if (field_meta.validate.type) {
					bt.setAsInput(parse_node(node[field_name]), block, field_name)
				} else {
					block.getField(field_name).setValue(node[field_name]);
				}
			}
		}

		if(node.next) {
			bt.setAsNext(parse_node(node.next), block)
		}

		return block;
	}
	
	return parse_node(ast.program);
}

const createBlocksForCode = (code, workspace) => {
	const ast = lpe_lib.babylon.parse(code);
	return createBlocksForAST(ast, workspace);
}

const transformCodeOnClick = function(source_id, button_id, target_id) {
  $('#' + button_id).on('click', function() {
      const code_source = $('#' + source_id);
      const target = $('#' + target_id);
      
      const ast = lpe_lib.babylon.parse(code_source.val());
      target.text(JSON.stringify(ast.program, undefined, 4));
    });
}

export { 
	transformCodeOnClick,
	blockDefinitionFromNode,
	blockDefinitionForNodeType,
	createBlocksForAST,
	createBlocksForCode
};