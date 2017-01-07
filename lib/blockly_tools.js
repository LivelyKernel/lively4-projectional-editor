// sets block as first statment for input 'inputName' of block 'intoBlock'
export function setAsFirstStatement(block, intoBlock, inputName) {
	let localConnection = new Blockly.RenderedConnection(intoBlock, Blockly.NEXT_STATEMENT);
	let otherConnection = new Blockly.RenderedConnection(block, Blockly.PREVIOUS_STATEMENT);
	
	localConnection.connect(otherConnection);
	
	intoBlock.getInput(inputName).connection = localConnection;
	block.previousConnection = otherConnection;
	
	block.setParent(intoBlock);
}

// sets block as as input 'inputName' of block 'intoBlock'
export function setAsInput(block, intoBlock, inputName) {
	let localConnection = new Blockly.RenderedConnection(intoBlock, Blockly.INPUT_VALUE);
	let otherConnection = new Blockly.RenderedConnection(block, Blockly.OUTPUT_VALUE);
	
	localConnection.connect(otherConnection);
	
	intoBlock.getInput(inputName).connection = localConnection;
	block.outputConnection = otherConnection;
	
	block.setParent(intoBlock);
}

// sets block as as next of intoBlock
export function setAsNext(block, intoBlock) {
	let localConnection = new Blockly.RenderedConnection(intoBlock, Blockly.NEXT_STATEMENT);
	let otherConnection = new Blockly.RenderedConnection(block, Blockly.PREVIOUS_STATEMENT);
	
	localConnection.connect(otherConnection);
	
	intoBlock.nextConnection = localConnection;
	block.previousConnection = otherConnection;
	
	block.setParent(intoBlock);
}

// updates available connections of block in regard of current context
export function updateBlockConnections(block) {
	let prevConnected = block.previousConnection &&
		block.previousConnection.isConnected();
	let nextConnected = block.nextConnection &&
		block.nextConnection.isConnected();
	let outConnected = block.outputConnection &&
		block.outputConnection.isConnected();
  		     
	if (prevConnected || nextConnected) {	
		block.setOutput(false, null);
		block.setNextStatement(true, null);	
		block.setNextStatement(true, null);	
	} else if (outConnected) {
	  block.setOutput(true, null);
		block.setPreviousStatement(false, null);
		block.setNextStatement(false, null);		        
	} else {		   
		block.setOutput(true, null);
		block.setPreviousStatement(true, null);
		block.setNextStatement(true, null);
	}
	
}


