#!/usr/bin/env node
import { generateTree } from '../src/generate-tree.js';
import minimist from 'minimist';
import path from 'path';

const USAGE = `
Usage: gen-tree [options] [baseDir]

Options:
  -o, --outputDir   Directory in which to save output files (default: "./trees")
  -j, --jsonFile    Path to comments JSON metadata file
                    (default: "<outputDir>/comments.json")
  -m, --mermaidFile Filename for the Mermaid flowchart
                    (default: "<outputDir>/tree.mmd")
      --help        Show this help message and exit
`;

function showHelpAndExit() {
  console.log(USAGE);
  process.exit(0);
}

function main() {
  const argv = minimist(process.argv.slice(2), {
    alias: { o: 'outputDir', j: 'jsonFile', m: 'mermaidFile' },
    string: ['outputDir', 'jsonFile', 'mermaidFile'],
    boolean: ['help'],
    default: {
      outputDir: './trees'
      // note: we no longer set defaults for jsonFile/mermaidFile here
    },
  });

  if (argv.help) {
    showHelpAndExit();
  }

  const rawArgs = process.argv.slice(2);
  const hasJsonFlag    = rawArgs.includes('-j') || rawArgs.includes('--jsonFile');
  const hasMermaidFlag = rawArgs.includes('-m') || rawArgs.includes('--mermaidFile');

  // 1) Determine baseDir
  const baseDir = argv._[0]
    ? path.resolve(process.cwd(), argv._[0])
    : process.cwd();

  // 2) Resolve outputDir (always relative to baseDir if not absolute)
  const outputDir = path.isAbsolute(argv.outputDir)
    ? argv.outputDir
    : path.resolve(baseDir, argv.outputDir);

  // 3) jsonFile & mermaidFile defaults INSIDE outputDir unless user explicitly passed them
  let jsonFile;
  if (hasJsonFlag) {
    jsonFile = path.isAbsolute(argv.jsonFile)
      ? argv.jsonFile
      : path.resolve(baseDir, argv.jsonFile);
  } else {
    jsonFile = path.join(outputDir, 'comments.json');
  }

  let mermaidFile;
  if (hasMermaidFlag) {
    mermaidFile = path.isAbsolute(argv.mermaidFile)
      ? argv.mermaidFile
      : path.resolve(baseDir, argv.mermaidFile);
  } else {
    mermaidFile = path.join(outputDir, 'tree.mmd');
  }

  // 4) Call into your module
  generateTree({
    baseDir,
    outputDir,
    jsonFile,
    mermaidFile,
  });
}

main();
