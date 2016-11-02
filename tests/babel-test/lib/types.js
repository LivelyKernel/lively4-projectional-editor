"use strict";

var _babylon = require("babylon");

var babylon = _interopRequireWildcard(_babylon);

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _babelTraverse = require("babel-traverse");

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Create test code
var code = 'var n = 5';
console.log(code);
var ast = babylon.parse(code);

//console.log(t.NODE_FIELDS.ForStatement.init.validate.oneOfNodeTypes);

//console.log(ast.program.body)

(0, _babelTraverse2.default)(ast, {
	enter: function enter(path) {

		console.log("<" + path.type + ">");

		// Get the type of the node
		/*const type = path.type;
  console.log("\nFound node of type " + type);
  	// Get the fields of the type
  const type_fields = t.NODE_FIELDS[type];
  	console.log(type_fields);*/

		/*for(const field_name in type_fields) {
  	const field = type_fields[field_name];
  	console.log("- " + field_name);
  		if(field.validate && field.validate.chainOf) {
  			// Decide if this is a series of nodes or a limited selection of nodes
  		if(field.validate.chainOf[0].type === 'array') {
  			console.log("-- Is an array of " + field.validate.chainOf[1].each.oneOfNodeTypes);
  		} else {
  			console.log("-- Allows one of the following " + field.validate.chainOf[0].type + " values: " + field.validate.chainOf[1].oneOf);
  		}
  		
  		//console.log(field.validate.chainOf)
  	} else {
  		console.log(field);
  	}
  }*/
	},
	exit: function exit(path) {
		console.log("</" + path.type + ">");
	}
});

//console.log(t.NODE_FIELDS.Identifier)