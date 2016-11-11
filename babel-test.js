import * as babylon from '../lively4-projectional-editor/node_modules/babylon/lib/index.js';

const transformCodeOnClick = function(source_id, button_id, target_id) {
  $('#' + button_id).on('click', function() {
      const code_source = $('#' + source_id);
      const target = $('#' + target_id);
      
      const ast = babylon.parse(code_source.val());
      target.text(JSON.stringify(ast.program, undefined, 4));
    });
}

export { transformCodeOnClick };