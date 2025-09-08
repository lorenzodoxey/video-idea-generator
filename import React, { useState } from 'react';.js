import React, { useState } from 'react';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateIdeas = async () => {
    // We will connect this to N8N in the next step
    console.log("Generating ideas for:", prompt);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Idea Generator</h1>
        <div className="input-section">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a topic for your video..."
          />
          <button onClick={handleGenerateIdeas} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Ideas'}
          </button>
        </div>
        <div className="ideas-section">
          {/* We will display the ideas here later */}
        </div>
      </header>
    </div>
  );
}

export default App;