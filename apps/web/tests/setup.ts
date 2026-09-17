import * as dotenv from 'dotenv';
import path from 'path';
import { afterAll, beforeAll, vi } from 'vitest';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

if (!process.env.DATABASE_URL_TEST) {
    throw new Error("DATABASE_URL_TEST must be defined in .env.test to run tests safely.");
}

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

import { prisma } from '../src/lib/prisma';

beforeAll(async () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || !dbUrl.includes('_test')) {
        throw new Error(`CRITICAL: Test suite is trying to use a database URL that doesn't look like a test database: ${dbUrl}`);
    }
});

afterAll(async () => {
    await prisma.$disconnect();
});

// Mock next/headers
let mockCookies: Record<string, string> = {};

vi.mock('next/headers', () => {
    return {
        headers: () => {
            const h = new Headers();
            h.set('host', 'localhost:3000');
            h.set('x-forwarded-proto', 'http');
            const cookieStr = Object.entries(mockCookies)
                .map(([name, value]) => `${name}=${value}`)
                .join('; ');
            h.set('cookie', cookieStr);
            return h;
        },
        cookies: () => ({
            get: (name: string) => {
                const value = mockCookies[name];
                return value ? { value } : undefined;
            },
            set: (name: string, value: string) => {
                mockCookies[name] = value;
            },
            getAll: () => {
                return Object.entries(mockCookies).map(([name, value]) => ({ name, value }));
            }
        })
    };
});

// Expose a helper to set mock cookies for tests
export function setMockCookie(name: string, value: string) {
    mockCookies[name] = value;
}
export function clearMockCookies() {
    mockCookies = {};
}
