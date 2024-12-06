from flask import Flask, request
from flask_cors import CORS
import subprocess
import jedi

app = Flask(__name__)
CORS(app)  # Allow all origins; you can restrict to specific origins later


@app.route('/autocomplete', methods=['POST'])
def autocomplete():
    """Provide autocompletion suggestions using Jedi."""
    try:
        # Get the code and cursor position from the request
        data = request.json
        code = data.get("code", "")
        line = data.get("line", 1)  # 1-based index
        column = data.get("column", 0)  # 0-based index
        print(f"Code: {code}\nLine: {line}, Column: {column}")

        # Use Jedi for autocompletion
        script = jedi.Script(code)
        completions = script.complete(line=line, column=column)

        # Format completions for the frontend
        suggestions = [
            {
                "label": completion.name,
                "kind": "Function" if completion.type == "function" else "Variable",
                "documentation": completion.docstring(),
                "insertText": completion.name
            }
            for completion in completions
        ]

        return {"suggestions": suggestions}, 200

    except Exception as e:
        return {"error": str(e)}, 500


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
