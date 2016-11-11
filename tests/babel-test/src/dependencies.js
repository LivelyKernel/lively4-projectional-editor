import * as babylon from "babylon";
import generate from "babel-generator";
import traverse from "babel-traverse";
import * as types from "babel-types";
import * as blockly from "node-blockly";
import * as blockly_tools from "./blockly-tools";

window.lpe = {
	babylon: babylon,
	generate: generate,
	traverse: traverse,
	types: types,
	blockly: blockly,
	blockly_tools: blockly_tools
};