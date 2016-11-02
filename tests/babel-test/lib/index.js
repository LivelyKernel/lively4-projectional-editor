"use strict";

var _babylon = require("babylon");

var babylon = _interopRequireWildcard(_babylon);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _babelTraverse = require("babel-traverse");

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Create a basic AST without any real content
var code = '';
var ast = babylon.parse(code);

// Pretend we have some block that defines a variable...
var declare_number_block = function declare_number_block(name, value) {
	return {
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [{
			type: 'VariableDeclarator',
			id: {
				type: 'Identifier',
				name: name
			},
			init: {
				type: 'NumericLiteral',
				value: value
			}
		}]
	};
};

// And some block that logs a variable...
var log_variable_block = function log_variable_block(name) {
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
			arguments: [{
				type: 'Identifier',
				name: name
			}]
		}
	};
};

// Write our program
var program = [declare_number_block('n', 4), log_variable_block('n')];

// Generate code
ast.program.body = program;
var gen = (0, _babelGenerator2.default)(ast, null, code);

// Print code
console.log("\n=== GENERATED CODE ===\n");
console.log(gen.code);

// Run code
console.log("\n=== RUNNING CODE ===\n");
eval(gen.code);