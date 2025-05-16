# Usage

This document explains how to install and run the `baobab` CLI to produce text and Mermaid trees of a repository.

---

## Installation

Install globally via npm:

```bash
npm install -g baobab-tree-gen
````

Or, if you’re developing locally:

```bash
git clone https://github.com/jhssilv/baobab.git
cd baobab
npm install
npm link
```

> After `npm link`, the `baobab` command will be available in your shell.

---

## Basic Command

Generate a tree for the current directory IN the current directory:

```bash
baobab .
```

This creates two files under `trees/`:

* `tree.txt` – a plain-text directory tree with optional inline comments
* `tree.mmd` – a Mermaid flowchart definition

---

## Options

| Flag            | Alias | Description                             | Default                 |
| --------------- | ----- | --------------------------------------- | ----------------------- |
| `--outputDir`   | `-o`  | Directory in which to save output files | `./trees`               |
| `--jsonFile`    | `-j`  | Path to the comments JSON metadata file | `./trees/comments.json` |
| `--mermaidFile` | `-m`  | Filename for the Mermaid flowchart      | `./trees/tree.mmd`      |
| `--help`        |       | Display help text and exit              | n/a                     |

---

## Examples

1. **Custom output folder**

   ```bash
   baobab ./my-code -o docs/tree-output
   ```

   Outputs go into `docs/tree-output/tree.txt` and `docs/tree-output/tree.mmd`.

2. **Use a custom comments file**

   ```bash
   baobab . -j ./meta/my-comments.json
   ```

   Reads and writes comments to the specified JSON file.

---

## Troubleshooting

* **No output files?**
  Ensure your current folder isn’t completely ignored by `.gitignore` (we skip everything matched there).

* **Permission denied**
  Verify you have write access to your chosen `--outputDir`.

---