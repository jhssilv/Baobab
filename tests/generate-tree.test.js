const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('gen-tree CLI', () => {
  const cli = path.resolve(__dirname, '../bin/cli.js');
  let tmpDir, baseDir, outputDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tree-gen-'));
    baseDir = tmpDir;
    // Setup sample structure
    fs.mkdirSync(path.join(baseDir, 'folderA'));
    fs.writeFileSync(path.join(baseDir, 'folderA', 'nested.js'), 'console.log(1);');
    fs.writeFileSync(path.join(baseDir, 'file1.txt'), 'hello');
    // .gitignore should ignore .ignoreMe
    fs.writeFileSync(path.join(baseDir, '.gitignore'), '.ignoreMe\n');
    fs.writeFileSync(path.join(baseDir, '.ignoreMe'), 'secret');
    outputDir = path.join(baseDir, 'outTrees');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('generates expected output files', () => {
    execSync(`node ${cli} ${baseDir} -o ${outputDir}`);
    ['tree.txt', 'comments.json', 'tree.mmd'].forEach(file => {
      const p = path.join(outputDir, file);
      expect(fs.existsSync(p)).toBe(true);
    });
  });

  test('directories appear before files in tree.txt', () => {
    execSync(`node ${cli} ${baseDir} -o ${outputDir}`);
    const lines = fs.readFileSync(path.join(outputDir, 'tree.txt'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .slice(1); // skip root

    const idxFolder = lines.findIndex(l => l.includes('folderA/'));
    const idxFile = lines.findIndex(l => l.includes('file1.txt'));
    expect(idxFolder).toBeGreaterThanOrEqual(0);
    expect(idxFile).toBeGreaterThanOrEqual(0);
    expect(idxFolder).toBeLessThan(idxFile);
  });

  test('ignores patterns from .gitignore', () => {
    execSync(`node ${cli} ${baseDir} -o ${outputDir}`);
    const content = fs.readFileSync(path.join(outputDir, 'tree.txt'), 'utf8');
    expect(content).not.toContain('.ignoreMe');
  });
});