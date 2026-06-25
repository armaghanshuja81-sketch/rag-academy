"""
Python Runner — Safely executes Python code submitted by users.
"""
import sys
import io
import traceback

def run_python_code(code, timeout_seconds=5):
    """
    Runs Python code in a restricted environment and returns output.
    """
    # Capture stdout
    old_stdout = sys.stdout
    old_stderr = sys.stderr
    captured_output = io.StringIO()
    sys.stdout = captured_output
    sys.stderr = captured_output

    result = {"output": "", "error": None, "success": True}

    # Restricted builtins for safety
    restricted_builtins = {
        'print': print,
        'len': len,
        'range': range,
        'int': int,
        'float': float,
        'str': str,
        'bool': bool,
        'list': list,
        'dict': dict,
        'tuple': tuple,
        'set': set,
        'True': True,
        'False': False,
        'None': None,
        'abs': abs,
        'max': max,
        'min': min,
        'sum': sum,
        'sorted': sorted,
        'reversed': reversed,
        'enumerate': enumerate,
        'zip': zip,
        'map': map,
        'filter': filter,
        'any': any,
        'all': all,
        'type': type,
        'isinstance': isinstance,
        'input': lambda prompt="": "[input not available in web runner]",
    }

    try:
        exec(code, {"__builtins__": restricted_builtins}, {})
        output_text = captured_output.getvalue()
        result["output"] = output_text if output_text else "(Code ran successfully, no output)"
    except Exception as e:
        result["success"] = False
        result["error"] = f"{type(e).__name__}: {str(e)}"
        result["output"] = captured_output.getvalue()
    finally:
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    return result
