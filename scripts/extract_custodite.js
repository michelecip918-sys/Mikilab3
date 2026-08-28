const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const FILE = path.resolve(__dirname, "../frontend/src/sections/RicetteCustodite.jsx");
const code = fs.readFileSync(FILE, "utf8");
const ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] });

const strings = new Set();
traverse(ast, {
  ObjectProperty(p) {
    const k = p.node.key;
    const name = k.type === "Identifier" ? k.name : (k.type === "StringLiteral" ? k.value : null);
    if (name === "it" && p.node.value.type === "StringLiteral") {
      const v = p.node.value.value;
      if (v && v.trim()) strings.add(v);
    }
  },
});

const arr = Array.from(strings);
fs.writeFileSync(path.resolve(__dirname, "custodite_it.json"), JSON.stringify(arr, null, 0));
console.log("custodite it strings:", arr.length);
