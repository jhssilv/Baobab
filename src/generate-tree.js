import fs from 'fs';
import path from 'path';
import ignore from 'ignore';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function loadGitignore(baseDir) {
  const ig = ignore().add(['.git', '.gitignore', 'trees/']);
  const gitignorePath = path.join(baseDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    ig.add(fs.readFileSync(gitignorePath, 'utf8'));
  }
  return ig;
}

/**
 * Recursively collect directory entries, filtering by ignore rules.
 * @param {string} dir - current directory
 * @param {object} ig - ignore instance
 * @param {object} comments - comment map
 * @param {boolean[]} branchStates - for drawing prefixes
 * @param {string} rootDir - the project root
 */
function collectLines(dir, ig, comments = {}, branchStates = [], rootDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter((ent) => {
      const fullPath = path.join(dir, ent.name);
      let rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      if (rel.startsWith('../')) rel = rel.replace(/^(\.\.\/)+/, '');
      if (ent.isDirectory()) rel += '/';
      return !ig.ignores(rel);
    })
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  let lines = [];
  entries.forEach((entry, idx) => {
    const isLast = idx === entries.length - 1;
    const prefix = branchStates.map((hasMore) => (hasMore ? '│   ' : '    ')).join('');
    const connector = isLast ? '└── ' : '├── ';
    const fullPath = path.join(dir, entry.name);
    let relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
    const isDir = entry.isDirectory();
    const key = isDir ? relPath + '/' : relPath;
    const comment = comments[key] || '';
    const name = entry.name + (isDir ? '/' : '');

    lines.push({ text: prefix + connector + name, comment, isDir, relPath });

    if (isDir) {
      lines = lines.concat(
        collectLines(fullPath, ig, comments, [...branchStates, !isLast], rootDir)
      );
    }
  });

  return lines;
}

export function generateTree(options = {}) {
  const {
    baseDir = process.cwd(),
    outputDir: userOut,
    jsonFile: userJson,
    mermaidFile: userMmd,
    comments = {}
  } = options;

  const rootDir = path.resolve(baseDir);
  const outDir = userOut
    ? path.resolve(rootDir, userOut)
    : path.join(rootDir, 'trees');
  const jsonFile = userJson
    ? path.resolve(rootDir, userJson)
    : path.join(outDir, 'comments.json');
  const mermaidFile = userMmd
    ? path.resolve(rootDir, userMmd)
    : path.join(outDir, 'tree.mmd');
  const txtFile = path.join(outDir, 'tree.txt');

  // ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // load or initialize comments JSON
  let mergedComments;
  if (!fs.existsSync(jsonFile)) {
    mergedComments = comments;
    fs.writeFileSync(jsonFile, JSON.stringify(mergedComments, null, 2), 'utf8');
    console.log(`ℹ️  Created new comments JSON at ${jsonFile}`);
  } else {
    try {
      mergedComments = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
      console.log(`ℹ️  Loaded comments from ${jsonFile}`);
    } catch {
      mergedComments = comments;
      console.warn(`⚠️ JSON parse failed, using defaults`);
    }
  }

  const ig = loadGitignore(rootDir);
  const rootLabel = path.basename(rootDir) + '/';
  const lines = collectLines(rootDir, ig, mergedComments, [], rootDir);

  // Write text tree
  const maxLen = Math.max(rootLabel.length, ...lines.map(l => l.text.length));
  const padded = [rootLabel];
  lines.forEach(({ text, comment }) => {
    if (comment) padded.push(text + ' '.repeat(maxLen - text.length + 2) + `# ${comment}`);
    else padded.push(text);
  });
  fs.writeFileSync(txtFile, padded.join('\n') + '\n', 'utf8');
  console.log(`✅ Tree saved to ${txtFile}`);

  // save filtered comments
  const filtered = Object.fromEntries(
    Object.entries(mergedComments).filter(([, v]) => v && v.trim())
  );
  fs.writeFileSync(jsonFile, JSON.stringify(filtered, null, 2), 'utf8');
  console.log(`✅ Comments JSON saved to ${jsonFile}`);

  // Mermaid output
  const nodeName = name => name.replace(/[^a-zA-Z0-9]/g, '_');
  let mermaid = 'flowchart LR\n';
  const added = new Set();
  const rootNode = nodeName(rootLabel);
  mermaid += `  ${rootNode}("${rootLabel}")\n`;
  added.add(rootLabel.replace(/\/$/, ''));

  lines.forEach(({ relPath, isDir }) => {
    const parts = relPath.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const sub = parts.slice(0, i).join('/');
      const display = parts[i-1] + (i === parts.length && isDir ? '/' : '');
      if (!added.has(sub)) {
        const parent = i === 1 ? rootNode : nodeName(parts.slice(0, i-1).join('/'));
        const current = nodeName(sub);
        mermaid += `  ${parent} --> ${current}("${display}")\n`;
        added.add(sub);
      }
    }
  });

  fs.writeFileSync(mermaidFile, mermaid, 'utf8');
  console.log(`✅ Mermaid saved to ${mermaidFile}`);
}
