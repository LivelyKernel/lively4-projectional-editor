System.import('../lively4-projectional-editor/node_modules/babylon/lib/index.js').then(
  function(babylon) {
    
    $('#ast-transform-button').on('click', function() {
      const code_source = $('#code-source');
      const target = $('#ast-target');
      
      const ast = babylon.parse(code_source.val());
      target.text(JSON.stringify(ast.program, undefined, 4));
    });
    
  }
);