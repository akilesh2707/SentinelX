import sys
import json
import subprocess

def main():
    try:
        # Read the exact JSON payload from stdin
        payload_str = sys.stdin.read()
        payload = json.loads(payload_str)

        code = payload.get("code", "")
        candidate_input = payload.get("input", "")

        # Execute the candidate code in a subprocess safely
        # shell=False ensures the code is passed purely as an argument to the python executable
        result = subprocess.run(
            ["python3", "-c", code],
            input=candidate_input.encode("utf-8"),
            capture_output=True,
            timeout=5 # Safe timeout limit for the child process inside the container
        )

        # We output standard result to the stdout of runner.py
        # Which is captured by the Node.js API
        sys.stdout.buffer.write(result.stdout)
        sys.stderr.buffer.write(result.stderr)
        sys.exit(result.returncode)

    except json.JSONDecodeError:
        print("Invalid runner payload", file=sys.stderr)
        sys.exit(1)
    except subprocess.TimeoutExpired:
        print("Execution timed out", file=sys.stderr)
        sys.exit(124) # 124 is typical timeout exit code
    except Exception as e:
        print(f"Runner error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
