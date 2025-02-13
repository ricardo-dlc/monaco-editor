require.config({
  paths: {
    vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs',
  },
});
require(['vs/editor/editor.main'], function () {
  const editor = monaco.editor.create(document.getElementById('editor'), {
    value: "# Write Python code here\nprint('Hello, Monaco!')",
    language: 'python',
    theme: 'vs-dark',
  });

  window.runCode = async function () {
    const code = editor.getValue();
    const response = await fetch('http://localhost:5000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const result = await response.text();
    document.getElementById('output').innerText = result;
  };

  // Register a completion provider
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: async function (model, position) {
      const code = model.getValue();
      const response = await fetch('http://localhost:5000/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          line: position.lineNumber,
          column: position.column - 1, // Monaco uses 1-based indexing
        }),
      });

      const result = await response.json();

      if (result.suggestions) {
        return {
          suggestions: result.suggestions.map((suggestion) => ({
            label: suggestion.label,
            kind:
              monaco.languages.CompletionItemKind[suggestion.kind] ||
              monaco.languages.CompletionItemKind.Text,
            insertText: suggestion.insertText,
            documentation: suggestion.documentation,
          })),
        };
      } else {
        return { suggestions: [] };
      }
    },
  });

  monaco.languages.registerHoverProvider('python', {
    provideHover: async function (model, position) {
      const code = model.getValue();

      // Send hover request to the backend
      const response = await fetch('http://localhost:5000/hover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          line: position.lineNumber, // 1-based line number
          column: position.column - 1, // 0-based column index
        }),
      });

      const result = await response.json();

      if (result.hover && result.hover.length > 0) {
        // Format the hover content
        const content = result.hover.map((h) => ({
          value: `**${h.name} (${h.type})**\n\n${h.docstring}`,
        }));

        return {
          contents: content,
        };
      }

      return { contents: [] }; // No hover content
    },
  });
});
