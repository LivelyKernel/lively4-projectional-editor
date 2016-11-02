import * as babylon from "babylon";
import generate from "babel-generator";
import traverse from "babel-traverse";
import * as t from "babel-types";

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
	return blockDefinitionFromNode(t.NODE_FIELDS[nodetype], nodetype)
}


const xmlFromAST = (ast) => {
	let id = 1;

	const parse_node = (node) => {
		let xml = '';
		const node_meta = t.NODE_FIELDS[node.type];

		xml += '<block type="babel_' + node.type + '" id="' + (id++) + '">';

		if(typeof node_meta.value !== 'undefined') {
				xml += '<field name="value">' + node.value + '</field>';
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
						// This is a series of nodes
						xml += '<statement name="' + field_name + '">';

						let node_list = node[field_name];

						if(node_list && node_list.length > 0) {
							// Transform list to tree
							for(let i = node_list.length-1; i > 0; i--) {
								node_list[i-1].next = node_list[i];
								node_list.pop();
							}

							xml += parse_node(node_list[0]);
						}

						xml += '</statement>';
					} else {
						xml += '<field name="' + field_name + '">';
						xml += node[field_name];
						xml += '</field>';
					}
					
					//console.log(field.validate.chainOf)
				} else if (field_meta.validate.oneOfNodeTypes) {
					xml += '<value name="' + field_name + '">';
					xml += parse_node(node[field_name]);
					xml += '</value>';
				} else if (field_meta.validate.type) {
					xml += '<value name="' + field_name + '">';
					xml += parse_node(node[field_name]);
					xml += '</value>';
				} else {
					xml += '<field name="' + field_name + '">';
					xml += node[field_name];
					xml += '</field>';
				}
			}
		}

		if(node.next) {
			xml += '<next>' + parse_node(node.next) + '</next>';
		}

		xml += '</block>';

		return xml;
	}

	return '<xml>' + parse_node(ast.program) + '</xml>';
}

const xmlFromCode = (code) => {
	const ast = babylon.parse(code);
	return xmlFromAST(ast);
}


// Export functions if we are running in a browser
if (window) {
	window.xmlFromCode = xmlFromCode;
	window.blockDefinitionForNodeType = blockDefinitionForNodeType;
}
