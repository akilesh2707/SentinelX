import { defineConfig } from 'vitest/config';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

if (!process.env.DATABASE_URL_TEST) {
    throw new Error("DATABASE_URL_TEST must be defined in .env.test to run tests safely.");
}

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        env: {
            DATABASE_URL: process.env.DATABASE_URL_TEST
        },
        server: {
            deps: {
                inline: ['next-auth']
            }
        },
        fileParallelism: false,
        include: ['tests/integration/**/*.test.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            'next/server': 'next/dist/server/web/exports/index.js'
        },
    },
});
