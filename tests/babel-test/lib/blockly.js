"use strict";

var _babylon = require("babylon");

var babylon = _interopRequireWildcard(_babylon);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _babelTraverse = require("babel-traverse");

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

var _blocklyTools = require("./blockly-tools");

var bt = _interopRequireWildcard(_blocklyTools);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var TYPE_PREFIX = "babel_";

var colors = {
	Program: 0,
	Identifier: 250,
	NumericLiteral: 150,
	StringLiteral: 150,
	Literal: 150,
	BinaryExpression: 60
};

var blockDefinitionFromNode = function blockDefinitionFromNode(node, nodetype) {
	return {
		init: function init() {

			// Always add one input with the title
			this.appendDummyInput().appendField(nodetype);

			// Default settings
			if (typeof colors[nodetype] !== 'undefined') {
				this.setColour(colors[nodetype]);
			} else {
				this.setColour(20);
			}
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setOutput(true, null);
			//this.setInputsInline(true);

			// Catch literals (they don't have inputs)
			if (typeof node === 'undefined' || node.value) {
				var field_name = 'value';
				this.appendDummyInput(field_name).appendField(field_name).appendField(new Blockly.FieldTextInput(""), field_name);
			} else {
				// Go through the inputs
				for (var _field_name in node) {
					var field = node[_field_name];

					// Check if this is a chaining input
					if (!field.validate) {
						//console.log("Error: field can't be validated:");
						//console.log(field);
						return {};
					}

					if (field.validate.chainOf) {

						// Decide if this is a series of nodes or a limited selection of nodes
						if (field.validate.chainOf[0].type === 'array') {
							// This is a series of nodes
							this.appendStatementInput(_field_name).setCheck(null).appendField(_field_name);
						} else {
							// This is a list of possible values
							// Create a properly formatted list
							var possible_values = field.validate.chainOf[1].oneOf.map(function (value) {
								return [value, value];
							});
							this.appendDummyInput().appendField(new Blockly.FieldDropdown(possible_values), _field_name);
						}

						//console.log(field.validate.chainOf)
					} else if (field.validate.oneOfNodeTypes) {
						this.appendValueInput(_field_name).setCheck(null).appendField(_field_name);
					} else if (field.validate.type) {
						this.appendValueInput(_field_name).setCheck(null).appendField(_field_name);
					} else {
						this.appendDummyInput(_field_name).appendField(_field_name).appendField(new Blockly.FieldTextInput(""), _field_name);
					}
				}
			}
		}
	};
};

var blockDefinitionForNodeType = function blockDefinitionForNodeType(nodetype) {
	return blockDefinitionFromNode(t.NODE_FIELDS[nodetype], nodetype);
};

var createBlocksForAST = function createBlocksForAST(ast, workspace) {
	var parse_node = function parse_node(node) {

		var node_meta = t.NODE_FIELDS[node.type];

		var block = workspace.newBlock(TYPE_PREFIX + node.type);
		block.babel_node = node;

		block.initSvg();
		block.render();

		if (typeof node_meta.value !== 'undefined') {
			block.getField("value").setValue(node.value);
		} else {
			// Go through the inputs
			for (var field_name in node_meta) {
				var field_meta = node_meta[field_name];

				// Check if this is a chaining input
				if (!field_meta.validate) {
					console.log("Error: field can't be validated:");
					console.log(field_meta);
					continue;
				}

				if (field_meta.validate.chainOf) {

					// Decide if this is a series of nodes or a limited selection of nodes
					if (field_meta.validate.chainOf[0].type === 'array') {

						var node_list = node[field_name];

						if (node_list && node_list.length > 0) {
							// Transform list to tree
							for (var i = node_list.length - 1; i > 0; i--) {
								node_list[i - 1].next = node_list[i];
								node_list.pop();
							}

							bt.setAsFirstStatement(parse_node(node_list[0]), block, field_name);
						}
					} else {
						block.getField(field_name).setValue(node[field_name]);
					}

					//console.log(field.validate.chainOf)
				} else if (field_meta.validate.oneOfNodeTypes) {
					bt.setAsInput(parse_node(node[field_name]), block, field_name);
				} else if (field_meta.validate.type) {
					bt.setAsInput(parse_node(node[field_name]), block, field_name);
				} else {
					block.getField(field_name).setValue(node[field_name]);
				}
			}
		}

		if (node.next) {
			bt.setAsNext(parse_node(node.next), block);
		}

		return block;
	};

	return parse_node(ast.program);
};

var createBlocksForCode = function createBlocksForCode(code, workspace) {
	var ast = babylon.parse(code);
	return createBlocksForAST(ast, workspace);
};

// Export functions if we are running in a browser
if (window) {
	window.createBlocksForCode = createBlocksForCode;
	window.blockDefinitionForNodeType = blockDefinitionForNodeType;
}