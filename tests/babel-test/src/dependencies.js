import * as babylon from "babylon";
import generate from "babel-generator";
import traverse from "babel-traverse";
import * as types from "babel-types";
import * as blockly from "node-blockly";

window.lpe_lib = {
	babylon: babylon,
	generate: generate,
	traverse: traverse,
	types: types,
	blockly: blockly
};