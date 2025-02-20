import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MonacoEditor, { type Monaco, type OnMount } from "@monaco-editor/react";
import {
  type editor,
  type IMarkdownString,
  type languages,
  type Position,
} from "monaco-editor/esm/vs/editor/editor.api";
import { useRef, useState } from "react";

type Editor = editor.IStandaloneCodeEditor;
type Model = editor.ITextModel;
type CompletionItem = languages.CompletionItem;
type CompletionList = languages.CompletionList;
type CompletionItemKind = languages.CompletionItemKind;
type Hover = languages.Hover;

const MonacoEditorApp = () => {
  const editorRef = useRef<Editor | null>(null);
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        setOutput(`Error: ${error.message}`);
      } else {
        setOutput(`An unknown error occurred`);
      }
    }
  };

  // Editor will mount
  const handleEditorDidMount: OnMount = (editor: Editor, monaco: Monaco) => {
    editorRef.current = editor;
    // Register completion provider
    monaco.languages.registerCompletionItemProvider("python", {
      async provideCompletionItems(model: Model, position: Position) {
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

          const result: CompletionList = await response.json();

          if (result.suggestions) {
            const wordUntilPosition = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordUntilPosition.startColumn,
              endColumn: wordUntilPosition.endColumn,
            };
            return {
              suggestions: result.suggestions.map(
                (suggestion: CompletionItem) => ({
                  label: suggestion.label,
                  kind: (monaco.languages.CompletionItemKind[suggestion.kind] ||
                    monaco.languages.CompletionItemKind
                      .Text) as CompletionItemKind,
                  insertText: suggestion.insertText,
                  documentation: suggestion.documentation,
                  range,
                })
              ),
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
      async provideHover(model: Model, position: Position) {
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

          const result: Hover = await response.json();

          if (result.contents?.length > 0) {
            return {
              contents: result.contents.map((h: IMarkdownString) => ({
                value: h.value,
                isTrusted: h.isTrusted,
                supportThemeIcons: h.supportThemeIcons,
                supportHtml: h.supportHtml,
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
          <MonacoEditor
            height="90vh"
            defaultLanguage="python"
            defaultValue={defaultCode}
            theme="vs-dark"
            onMount={handleEditorDidMount}
          />
        </CardContent>
      </Card>

      <Button
        onClick={handleRunCode}
        className="mb-4 bg-sky-300 cursor-pointer"
      >
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
