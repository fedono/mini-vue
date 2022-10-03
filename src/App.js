import { baseCompile } from './compiler-core';
import './App.css';

function App() {
  const str = `<div>jacy{{name}}<span>wal</span></div>`;
  const ast = baseCompile(str);

  return (
    <div className="App">
      <code>{JSON.stringify(ast, null, 2)}</code>
    </div>
  );
}

export default App;
