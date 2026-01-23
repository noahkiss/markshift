#!/usr/bin/env node
/**
 * CLI entry point for markshift
 *
 * @packageDocumentation
 */
import { run } from './program.js';

run().catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
