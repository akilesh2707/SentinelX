import { spawn, execFile } from "child_process";
import { randomUUID } from "crypto";

export type ExecutionResult = {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
    durationMs: number;
};

const MAX_OUTPUT_BYTES = 50 * 1024; // 50KB limit per stream
const HARD_TIMEOUT_MS = 5000; // 5 seconds max

export async function runPythonCode(code: string, input: string): Promise<ExecutionResult> {
    const containerName = `sentinelx-run-${randomUUID()}`;
    const startTime = Date.now();

    // Strict Docker Arguments ensuring server-authority and defense-in-depth isolation
    const dockerArgs = [
        "run",
        "-i", // Keep stdin open even if not attached
        "--rm", // Automatically remove the container when it exits
        "--name", containerName,
        "--network", "none", // Block all networking
        "--memory", "128m", // Limit RAM
        "--cpus", "0.5", // Limit CPU usage to 50% of one core
        "--read-only", // Make root filesystem read-only
        "--cap-drop", "ALL", // Drop all Linux capabilities
        "--security-opt", "no-new-privileges", // Prevent privilege escalation
        "--pids-limit", "64", // Prevent fork bombs
        "sentinelx-python-runner" // Fixed image definition
    ];

    const payload = JSON.stringify({ code, input });

    return new Promise((resolve) => {
        let stdout = "";
        let stderr = "";
        let exitCode = 1;
        let timedOut = false;
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let isDone = false;

        const child = spawn("docker", dockerArgs, { stdio: ["pipe", "pipe", "pipe"] });

        const cleanupContainer = () => {
            // Explicit cleanup mechanism guarantees the container dies even if it detaches
            execFile("docker", ["rm", "-f", containerName], () => {});
        };

        const finish = (code: number, timeout: boolean = false) => {
            if (isDone) return;
            isDone = true;
            exitCode = code;
            timedOut = timeout;

            cleanupContainer();

            resolve({
                stdout,
                stderr,
                exitCode,
                timedOut,
                durationMs: Date.now() - startTime
            });
        };

        // Output limits
        child.stdout.on("data", (data: Buffer) => {
            stdoutBytes += data.length;
            if (stdoutBytes > MAX_OUTPUT_BYTES) {
                stdout += data.toString("utf8").substring(0, MAX_OUTPUT_BYTES - (stdoutBytes - data.length));
                stdout += "\n...[stdout truncated due to length limits]...";
                child.kill("SIGKILL");
            } else {
                stdout += data.toString("utf8");
            }
        });

        child.stderr.on("data", (data: Buffer) => {
            stderrBytes += data.length;
            if (stderrBytes > MAX_OUTPUT_BYTES) {
                stderr += data.toString("utf8").substring(0, MAX_OUTPUT_BYTES - (stderrBytes - data.length));
                stderr += "\n...[stderr truncated due to length limits]...";
                child.kill("SIGKILL");
            } else {
                stderr += data.toString("utf8");
            }
        });

        child.on("close", (code) => {
            finish(code ?? 1);
        });

        child.on("error", (error) => {
            stderr += `\nInternal Execution Error: ${error.message}`;
            finish(1);
        });

        // Enforce rigid timeout
        const timeoutId = setTimeout(() => {
            if (!isDone) {
                stderr += "\n[Execution terminated due to timeout]";
                child.kill("SIGKILL");
                finish(124, true);
            }
        }, HARD_TIMEOUT_MS);

        // Write the data payload strictly into stdin (never interpolated into a shell arg)
        try {
            child.stdin.write(payload);
            child.stdin.end();
        } catch (err: any) {
            stderr += `\nFailed to write input to container: ${err.message}`;
            finish(1);
        }

        // Ensure timeout is cleared gracefully if finished early
        child.on("close", () => clearTimeout(timeoutId));
    });
}
