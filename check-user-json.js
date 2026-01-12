// 测试你提供的 JSON 是否会被正确解析
const testJson = {
  "files": {
    "src/App.tsx": "import React, { useState } from 'react';\n\nfunction App() {\n  return <div>Hello</div>;\n}\n\nexport default App;",
    "src/index.css": "body { margin: 0; }",
    "README.md": "# Test\n\nThis is a test."
  }
};

console.log('=== 原始对象 ===');
console.log(testJson.files['src/App.tsx']);

console.log('\n=== JSON.stringify() 后 ===');
const jsonStr = JSON.stringify(testJson);
console.log(jsonStr.substring(0, 200) + '...');

console.log('\n=== JSON.parse() 后 ===');
const parsed = JSON.parse(jsonStr);
console.log(parsed.files['src/App.tsx']);

console.log('\n=== 验证换行符 ===');
console.log('包含 \\n 字面量:', parsed.files['src/App.tsx'].includes('\\n'));
console.log('包含真正换行:', parsed.files['src/App.tsx'].includes('\n'));
