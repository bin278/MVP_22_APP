// 测试 JSON 解析
const testJson = `{
  "files": {
    "src/App.tsx": "import React, { useState } from 'react';\\n\\nfunction App() {\\n  const [count, setCount] = useState(0);\\n  return (\\n    <div>\\n      <h1>Hello</h1>\\n    </div>\\n  );\\n}\\n\\nexport default App;",
    "src/index.css": "body { margin: 0; }"
  }
}`;

console.log('=== 原始 JSON ===');
console.log(testJson);

console.log('\n=== JSON.parse() 后的结果 ===');
const parsed = JSON.parse(testJson);
console.log('App.tsx 内容:');
console.log(parsed.files['src/App.tsx']);

console.log('\n=== 验证换行符是否存在 ===');
console.log('包含换行符:', parsed.files['src/App.tsx'].includes('\n'));
console.log('第一个换行符位置:', parsed.files['src/App.tsx'].indexOf('\n'));
