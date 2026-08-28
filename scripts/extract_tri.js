const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const ROOT = path.resolve(__dirname, "../frontend/src");
const exts = [".js", ".jsx"];
const triNames = new Set(["tri", "triNav", "triM", "L"]);
const tri3Names = new Set(["tri3"]);

function walk(dir, files = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (exts.includes(path.extname(e.name))) files.push(p);
  }
  return files;
}

function litValue(node) {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0)
    return node.quasis.map((q) => q.cooked).join("");
  return null; // dynamic -> skip
}

const strings = new Set();
const files = walk(ROOT);
let calls = 0;

for (const file of files) {
  const code = fs.readFileSync(file, "utf8");
  let ast;
  try {
    ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] });
  } catch (err) {
    console.error("parse fail", file, err.message);
    continue;
  }
  traverse(ast, {
    CallExpression(pathNode) {
      const callee = pathNode.node.callee;
      const name = callee && callee.type === "Identifier" ? callee.name : null;
      let itArg = null;
      if (name && triNames.has(name)) itArg = pathNode.node.arguments[0];
      else if (name && tri3Names.has(name)) itArg = pathNode.node.arguments[1];
      else if (callee && callee.type === "CallExpression" && callee.callee && callee.callee.type === "Identifier" && callee.callee.name === "mkTri") itArg = pathNode.node.arguments[0];
      else return;
      const v = litValue(itArg);
      if (v && v.trim()) { strings.add(v); calls++; }
    },
  });
}

const arr = Array.from(strings);
fs.writeFileSync(path.resolve(__dirname, "tri_strings.json"), JSON.stringify(arr, null, 0));
console.log("files:", files.length, "matched calls (static):", calls, "unique strings:", arr.length);
