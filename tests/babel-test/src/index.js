import * as babylon from "babylon";
import generate from "babel-generator";
import traverse from "babel-traverse";

// Create a basic AST without any real content
const code = '';
const ast = babylon.parse(code);

// Pretend we have some block that defines a variable...
const declare_number_block = function(name, value) {
	return {
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [
			{
				type: 'VariableDeclarator',
				id: {
					type: 'Identifier',
					name: name
				},
				init: {
					type: 'NumericLiteral',
					value: value
				}
			}
		]
	}
}

// And some block that logs a variable...
const log_variable_block = function(name) {
	return {
		type: 'ExpressionStatement',
		expression: {
			type: 'CallExpression',
			callee: {
				type: 'MemberExpression',
				object: {
					type: 'Identifier',
					name: 'console'
				},
				property: {
					type: 'Identifier',
					name: 'log'
				}
			},
			arguments: [
				{
					type: 'Identifier',
					name: name
				}
			]
		}
	}
}

// Write our program
const program = [
	declare_number_block('n', 4),
	log_variable_block('n')
];

// Generate code
ast.program.body = program;
const gen = generate(ast, null, code);

// Print code
console.log("\n=== GENERATED CODE ===\n");
console.log(gen.code);

// Run code
console.log("\n=== RUNNING CODE ===\n");
eval(gen.code)