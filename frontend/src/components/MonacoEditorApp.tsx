/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

// Define types for our backend responses
interface AutocompleteResponse {
  suggestions: {
    label: string;
    kind: string;
    insertText: string;
    documentation: string;
  }[];
}

interface HoverResponse {
  hover: {
    name: string;
    type: string;
    docstring: string;
  }[];
}

const MonacoEditorApp = () => {
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const [output, setOutput] = useState<string>("");
  const defaultCode = `# Write Python code here\nprint('Hello, Monaco!')`;

  // Function to run the code
  const handleRunCode = async () => {
    try {
      const response = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: editorRef.current?.getValue() }),
      });
      const result = await response.text();
      setOutput(result);
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Editor will mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Register completion provider
    monaco.languages.registerCompletionItemProvider("python", {
      async provideCompletionItems(model, position) {
        try {
          const response = await fetch("http://localhost:5000/autocomplete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: model.getValue(),
              line: position.lineNumber,
              column: position.column - 1,
            }),
          });

          const result: AutocompleteResponse = await response.json();

          if (result.suggestions) {
            return {
              suggestions: result.suggestions.map((suggestion) => ({
                label: suggestion.label,
                kind:
                  monaco.languages.CompletionItemKind[
                    suggestion.kind as keyof typeof monaco.languages.CompletionItemKind
                  ] || monaco.languages.CompletionItemKind.Text,
                insertText: suggestion.insertText,
                documentation: suggestion.documentation,
                range: model.getFullModelRange(),
              })),
            };
          }
        } catch (error) {
          console.error("Autocomplete error:", error);
        }
        return { suggestions: [] };
      },
    });

    // Register hover provider
    monaco.languages.registerHoverProvider("python", {
      async provideHover(model: any, position: any) {
        try {
          const response = await fetch("http://localhost:5000/hover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: model.getValue(),
              line: position.lineNumber,
              column: position.column - 1,
            }),
          });

          const result: HoverResponse = await response.json();

          if (result.hover?.length > 0) {
            return {
              contents: result.hover.map((h) => ({
                value: `**${h.name} (${h.type})**\n\n${h.docstring}`,
              })),
            };
          }
        } catch (error) {
          console.error("Hover error:", error);
        }
        return { contents: [] };
      },
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardContent className="p-4">
          <Editor
            height="90vh"
            defaultLanguage="python"
            defaultValue={defaultCode}
            theme="vs-dark"
            onMount={handleEditorDidMount}
          />
        </CardContent>
      </Card>

      <Button onClick={handleRunCode} className="mb-4 bg-sky-300 cursor-pointer">
        Run Code
      </Button>

      <Card>
        <CardContent>
          <pre className="p-4 bg-gray-100 rounded">{output}</pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonacoEditorApp;
