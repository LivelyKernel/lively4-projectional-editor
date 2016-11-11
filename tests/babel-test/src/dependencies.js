import * as babylon from "babylon";
import generate from "babel-generator";
import traverse from "babel-traverse";
import * as types from "babel-types";

window.lpe_babel = {
	babylon: babylon,
	generate: generate,
	traverse: traverse,
	types: types
};