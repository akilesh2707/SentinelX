import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../src/lib/prisma";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";

const execFileAsync = promisify(execFile);

export async function GET(req: NextRequest) {
    const startTime = performance.now();

    // Application is inherently healthy if this route is running
    const application = {
        status: "HEALTHY",
        message: "API routing is operational",
        latencyMs: 0
    };

    // Database & Prisma checks
    let databaseStatus = "OFFLINE";
    let prismaStatus = "OFFLINE";
    let databaseMessage = "Could not reach database";
    let prismaMessage = "Prisma client failed to communicate";
    let dbLatencyMs = 0;

    const dbStart = performance.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbLatencyMs = Math.round(performance.now() - dbStart);
        databaseStatus = "HEALTHY";
        databaseMessage = "Database is responding normally";
        prismaStatus = "HEALTHY";
        prismaMessage = "Prisma client connected successfully";
    } catch (err) {
        dbLatencyMs = Math.round(performance.now() - dbStart);
        databaseStatus = "ERROR";
        prismaStatus = "ERROR";
    }

    // Docker check
    let dockerStatus = "OFFLINE";
    let dockerMessage = "Docker daemon is unreachable or not running";
    let dockerLatencyMs = 0;

    const dockerStart = performance.now();
    try {
        await execFileAsync("docker", ["info"], { timeout: 2000 });
        dockerLatencyMs = Math.round(performance.now() - dockerStart);
        dockerStatus = "HEALTHY";
        dockerMessage = "Docker daemon is active and responding";
    } catch (err: any) {
        dockerLatencyMs = Math.round(performance.now() - dockerStart);
        // Do not leak stdout/stderr or paths
        dockerMessage = "Docker daemon is offline or inaccessible";
    }

    application.latencyMs = Math.round(performance.now() - startTime);

    // Determine overall status
    let overallStatus = "HEALTHY";

    if (databaseStatus === "ERROR" || prismaStatus === "ERROR") {
        overallStatus = "ERROR"; // Core critical failure
    } else if (dockerStatus === "OFFLINE") {
        overallStatus = "DEGRADED"; // Non-critical but important feature unavailable
    }

    const runtime = {
        status: "HEALTHY",
        message: "Runtime metrics collected",
        details: {
            nodeVersion: process.version,
            platform: os.platform(),
            architecture: os.arch(),
            cpuCount: os.cpus().length,
            memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        }
    };

    return NextResponse.json({
        overallStatus,
        checkedAt: new Date().toISOString(),
        services: {
            application,
            database: {
                status: databaseStatus,
                message: databaseMessage,
                latencyMs: dbLatencyMs
            },
            prisma: {
                status: prismaStatus,
                message: prismaMessage,
                latencyMs: dbLatencyMs
            },
            docker: {
                status: dockerStatus,
                message: dockerMessage,
                latencyMs: dockerLatencyMs
            },
            runtime
        }
    });
}
