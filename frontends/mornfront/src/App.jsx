import { useState } from 'react'
import './App.css'

function App() {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="app">
      <header className="header">
        <h1>mornFront</h1>
        <p className="tagline">One word to app front</p>
      </header>
      
      <main className="main">
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter a word..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="main-input"
          />
          <button className="submit-btn">Go</button>
        </div>
        
        <div className="info">
          <p>Welcome to mornhub.dev</p>
          <p className="port-info">Running on port 3009</p>
        </div>
      </main>
      
      <footer className="footer">
        <p>Built with ❤️ for mornhub.dev</p>
      </footer>
    </div>
  )
}

export default App

