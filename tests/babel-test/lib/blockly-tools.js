"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.setAsFirstStatement = setAsFirstStatement;
exports.setAsInput = setAsInput;
exports.setAsNext = setAsNext;
exports.updateBlockConnections = updateBlockConnections;

var _nodeBlockly = require("node-blockly");

var _nodeBlockly2 = _interopRequireDefault(_nodeBlockly);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// sets block as first statment for input 'inputName' of block 'intoBlock'
function setAsFirstStatement(block, intoBlock, inputName) {
	var localConnection = new Blockly.RenderedConnection(intoBlock, Blockly.NEXT_STATEMENT);
	var otherConnection = new Blockly.RenderedConnection(block, Blockly.PREVIOUS_STATEMENT);

	localConnection.connect(otherConnection);

	intoBlock.getInput(inputName).connection = localConnection;
	block.previousConnection = otherConnection;

	block.setParent(intoBlock);
}

// sets block as as input 'inputName' of block 'intoBlock'
function setAsInput(block, intoBlock, inputName) {
	var localConnection = new Blockly.RenderedConnection(intoBlock, Blockly.INPUT_VALUE);
	var otherConnection = new Blockly.RenderedConnection(block, Blockly.OUTPUT_VALUE);

	localConnection.connect(otherConnection);

	intoBlock.getInput(inputName).connection = localConnection;
	block.outputConnection = otherConnection;

	block.setParent(intoBlock);
}

// sets block as as next of intoBlock
function setAsNext(block, intoBlock) {
	var localConnection = new Blockly.RenderedConnection(intoBlock, Blockly.NEXT_STATEMENT);
	var otherConnection = new Blockly.RenderedConnection(block, Blockly.PREVIOUS_STATEMENT);

	localConnection.connect(otherConnection);

	intoBlock.nextConnection = localConnection;
	block.previousConnection = otherConnection;

	block.setParent(intoBlock);
}

// updates available connections of block in regard of current context
function updateBlockConnections(block) {
	var prevConnected = block.previousConnection && block.previousConnection.isConnected();
	var nextConnected = block.nextConnection && block.nextConnection.isConnected();
	var outConnected = block.outputConnection && block.outputConnection.isConnected();

	if (prevConnected || nextConnected) {
		block.setOutput(false, null);
	} else if (outConnected) {
		block.setPreviousStatement(false, null);
		block.setNextStatement(false, null);
	} else {
		block.setOutput(true, null);
		block.setPreviousStatement(true, null);
		block.setNextStatement(true, null);
	}
}