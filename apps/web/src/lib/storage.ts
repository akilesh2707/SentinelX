import fs from 'fs/promises';
import path from 'path';

// Base directory for local evidence storage, outside the public/ directory.
const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'evidence');

export const EvidenceStorage = {
    /**
     * Saves a buffer to local storage.
     * Path traversal protection is inherently handled by path.join and path.resolve,
     * but we also explicitly check that the resolved path is within STORAGE_ROOT.
     */
    async save(attemptId: string, evidenceId: string, extension: string, buffer: Buffer): Promise<string> {
        const safeAttemptId = attemptId.replace(/[^a-zA-Z0-9_-]/g, '');
        const safeEvidenceId = evidenceId.replace(/[^a-zA-Z0-9_-]/g, '');
        const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, '');
        
        const dirPath = path.join(STORAGE_ROOT, safeAttemptId);
        const filePath = path.join(dirPath, `${safeEvidenceId}.${safeExtension}`);

        // Ensure path traversal is not possible
        if (!filePath.startsWith(STORAGE_ROOT)) {
            throw new Error("Invalid storage path");
        }

        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(filePath, buffer);

        // Return the logical storage key
        return `${safeAttemptId}/${safeEvidenceId}.${safeExtension}`;
    },

    /**
     * Reads a file buffer from local storage based on the storageKey.
     */
    async read(storageKey: string): Promise<Buffer> {
        const filePath = path.join(STORAGE_ROOT, storageKey);
        
        // Prevent path traversal
        const resolvedPath = path.resolve(filePath);
        const resolvedRoot = path.resolve(STORAGE_ROOT);
        if (!resolvedPath.startsWith(resolvedRoot)) {
            throw new Error("Invalid storage key");
        }

        return await fs.readFile(resolvedPath);
    },

    /**
     * Deletes a file from local storage. Gracefully ignores if the file doesn't exist.
     */
    async delete(storageKey: string): Promise<void> {
        const filePath = path.join(STORAGE_ROOT, storageKey);
        
        const resolvedPath = path.resolve(filePath);
        const resolvedRoot = path.resolve(STORAGE_ROOT);
        if (!resolvedPath.startsWith(resolvedRoot)) {
            throw new Error("Invalid storage key");
        }

        try {
            await fs.unlink(resolvedPath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
};
