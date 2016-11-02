import * as babylon from "babylon";
import generate from "babel-generator";
import traverse from "babel-traverse";
import * as t from "babel-types";

// Create test code
const code = 'var n = 5';
console.log(code);
const ast = babylon.parse(code);

//console.log(t.NODE_FIELDS.ForStatement.init.validate.oneOfNodeTypes);

//console.log(ast.program.body)

traverse(ast, {
	enter(path) {

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
	exit(path) {
		console.log("</" + path.type + ">");
	}
});

//console.log(t.NODE_FIELDS.Identifier)