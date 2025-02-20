import subprocess

import docstring_parser
import jedi
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow all origins; you can restrict to specific origins later


@app.route("/autocomplete", methods=["POST"])
def autocomplete():
    """Provide autocompletion suggestions using Jedi."""
    try:
        # Get the code and cursor position from the request
        data = request.json
        code = data.get("code", "")
        line = data.get("line", 1)  # 1-based index
        column = data.get("column", 0)  # 0-based index

        # Use Jedi for autocompletion
        script = jedi.Script(code)
        completions = script.complete(line=line, column=column)

        # Format completions for the frontend
        suggestions = [
            {
                "label": completion.name,
                "kind": "Function" if completion.type == "function" else "Variable",  # noqa E501
                "documentation": completion.docstring(),
                "insertText": completion.name,
            }
            for completion in completions
        ]

        return {"suggestions": suggestions}, 200

    except Exception as e:
        return {"error": str(e)}, 500


@app.route("/hover", methods=["POST"])
def hover():
    """Provide hover information using Jedi."""
    try:
        data = request.json
        code = data.get("code", "")
        line = data.get("line", 1)
        column = data.get("column", 0)

        script = jedi.Script(code)
        definitions = script.infer(line=line, column=column)

        if not definitions:
            return jsonify({"hover": None}), 200

        hover_content = []
        for d in definitions:
            docstring = d.docstring()
            if docstring:
                parsed_doc = docstring_parser.parse(docstring)

                # Format function/class signature if available
                markdown_doc = f"### `{d.name}` ({d.type})\n\n"

                # Add the short and long descriptions while preserving newlines
                if parsed_doc.short_description:
                    markdown_doc += f"**{parsed_doc.short_description}**\n\n"
                if parsed_doc.long_description:
                    markdown_doc += f"{parsed_doc.long_description}\n\n"

                if parsed_doc.params:
                    markdown_doc += "**Parameters:**\n"
                    for param in parsed_doc.params:
                        param_name = param.arg_name
                        param_type = param.type_name or "unknown"
                        param_desc = param.description or ""

                        # Format with indentation for multi-line descriptions
                        formatted_desc = "\n  ".join(param_desc.split("\n"))
                        markdown_doc += f"- **{param_name}** (`{param_type}`)\n\n  {formatted_desc}\n"

                if parsed_doc.returns:
                    markdown_doc += "\n**Returns:**\n"
                    markdown_doc += f"- `{parsed_doc.returns.type_name}`: {parsed_doc.returns.description}\n"

                # Extract and format examples properly
                if parsed_doc.examples:
                    markdown_doc += "\n**Examples:**\n\n"
                    for example in parsed_doc.examples:
                        example_code = (
                            example.description.strip()
                        )  # Extract example description
                        snippet = (
                            example.snippet.strip() if example.snippet else ""
                        )  # Extract example snippet

                        if example_code:
                            markdown_doc += (
                                f"{example_code}\n\n```python\n{snippet}\n```\n"
                            )

                hover_item = {
                    "value": markdown_doc,
                    "isTrusted": False,
                    "supportThemeIcons": True,
                    "supportHtml": False,
                }

                hover_content.append(hover_item)

        return jsonify({"contents": hover_content}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route("/run", methods=["POST"])
def run_code():
    data = request.json
    code = data.get("code", "")
    try:
        # Run the code using a subprocess
        result = subprocess.run(
            ["python3", "-c", code], capture_output=True, text=True, check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        return e.stderr, 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
