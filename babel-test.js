//System.paths['*'] = '../lively4-projectional-editor/node_modules/';
//console.log("ASDF");
//console.log(System.paths);
import * as babylon from '../lively4-projectional-editor/node_modules/babylon/lib/index.js';
//import * as types from "../lively4-projectional-editor/node_modules/babel-types/lib/index.js";

/*oldBaseURL = System.baseURL;
System.baseURL = 'https://lively-kernel.org/lively4/lively4-projectional-editor/';
import * as babylon from 'babylon/lib/index.js';
System.baseURL = oldBaseURL;
*/
//delete System.paths['*'];
//import * as generator from '../lively4-projectional-editor/node_modules/babel-generator/lib/index.js';
//import generate from "babel-generator";
//import traverse from "babel-traverse";
//import * as t from "babel-types";
//import * as bt from "./blockly-tools";

const transformCodeOnClick = function(source_id, button_id, target_id) {
  $('#' + button_id).on('click', function() {
      const code_source = $('#' + source_id);
      const target = $('#' + target_id);
      
      const ast = babylon.parse(code_source.val());
      target.text(JSON.stringify(ast.program, undefined, 4));
    });
}

export { transformCodeOnClick };