const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const FILES = [
  "sections/Home.jsx",
  "components/PaywallGate.jsx",
  "components/SaporeDelGiorno.jsx",
  "data/content.js",
  "sections/GuidaMetodi.jsx",
  "sections/Enciclopedia.jsx",
  "components/AvatarBubbles.jsx",
  "sections/Beginners.jsx",
  "sections/Glossario.jsx",
  "sections/LegalPage.jsx",
  "components/IntroGuide.jsx",
].map((f) => path.resolve(__dirname, "../frontend/src/" + f));

const strings = new Set();

function collectStrings(node) {
  if (!node) return;
  if (node.type === "StringLiteral") { if (node.value.trim()) strings.add(node.value); return; }
  for (const key in node) {
    if (key === "loc" || key === "start" || key === "end") continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === "string" && collectStrings(c));
    else if (v && typeof v.type === "string") collectStrings(v);
  }
}

for (const fp of FILES) {
  const code = fs.readFileSync(fp, "utf8");
  const ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] });
  traverse(ast, {
    ObjectProperty(p) {
      const k = p.node.key;
      const name = k.type === "Identifier" ? k.name : (k.type === "StringLiteral" ? k.value : null);
      if (name === "it") collectStrings(p.node.value);
    },
  });
}

const arr = Array.from(strings);
fs.writeFileSync(path.resolve(__dirname, "data_it.json"), JSON.stringify(arr, null, 0));
console.log("data it strings:", arr.length);
