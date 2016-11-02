import * as babylon from "babylon";
import generate from "babel-generator";
import traverse from "babel-traverse";

// Prepare an empty 'container'
const code = `console.log(n)`;

// Create a basic AST
const ast = babylon.parse(code);

console.log(ast.program.body[0].expression.arguments);