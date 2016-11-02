# babel-test

This is a simple test that reads some node definitions from babel and creates the corresponding Blockly nodes.
The user can then enter some JavaScript code and press 'Transform'. The code will be parsed by babel and transformed
into an AST. The AST is then transformed into the blockly XML format and loaded.