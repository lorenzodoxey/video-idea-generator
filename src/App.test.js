import React, { useState } from 'react';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [loadingLocationFor, setLoadingLocationFor] = useState(null);
  const [loadingScriptFor, setLoadingScriptFor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIdeaForScript, setCurrentIdeaForScript] = useState(null);
  const [scriptParams, setScriptParams] = useState({
    voiceover: 'No',
    speakers: '1',
  });

  const handleGenerateIdeas = async () => {
    // --- START OF DIAGNOSTIC LOGS ---
    console.log("Step 1: 'Generate Ideas' function started.");
    setLoading(true);
    setGeneratedIdeas([]);
    try {
      const url = process.env.REACT_APP_N8N_IDEA_URL;
      console.log("Step 2: The URL for the request is:", url);

      if (!url) {
        console.error("CRITICAL ERROR: The URL is missing. Check your .env file and restart the server.");
        alert("Configuration Error: The idea generator URL is missing. Please check the console.");
        setLoading(false);
        return;
      }

      console.log("Step 3: Sending the fetch request...");
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt }),
      });

      console.log("Step 4: Received a response. Status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log("Step 5: Converting the response to JSON...");
      const data = await response.json();
      console.log("Step 6: AI Response data received:", data);
      
      const ideasArray = data[0]?.output?.ideas || [];
      console.log("Step 7: Extracted ideas array:", ideasArray);
      
      setGeneratedIdeas(ideasArray);

    } catch (error) {
      console.error("Step 8: An error occurred inside the 'try...catch' block:", error);
      alert("An error occurred. See the console for details.");
    }
    setLoading(false);
    console.log("Step 9: 'Generate Ideas' function finished.");
    // --- END OF DIAGNOSTIC LOGS ---
  };

  const handleSaveIdea = (ideaToSave) => {
    const newSavedIdea = {
      id: Date.now(),
      ideaText: ideaToSave,
      suggestedArea: '',
      generatedLocations: [],
      selectedLocations: [],
      script: [],
    };
    setSavedIdeas((currentSaved) => [...currentSaved, newSavedIdea]);
  };

  const handleFindLocations = async (ideaId, ideaText) => {
    // This function remains the same as the last working version
    setLoadingLocationFor(ideaId);
    try {
      const response = await fetch(process.env.REACT_APP_N8N_LOCATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: ideaText }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const output = data[0]?.output;
      const suggestedArea = output?.suggestedArea || 'Area not found';
      const locationsArray = output?.locations || [];
      setSavedIdeas((currentIdeas) =>
        currentIdeas.map((idea) =>
          idea.id === ideaId
            ? { ...idea, generatedLocations: locationsArray, suggestedArea: suggestedArea }
            : idea
        )
      );
    } catch (error) {
      console.error('Error fetching locations:', error);
      alert('Failed to fetch locations. Check console.');
    }
    setLoadingLocationFor(null);
  };

  const handleLocationSelect = (ideaId, location, isChecked) => {
    setSavedIdeas((currentIdeas) =>
      currentIdeas.map((idea) => {
        if (idea.id === ideaId) {
          const newSelectedLocations = isChecked
            ? [...idea.selectedLocations, location]
            : idea.selectedLocations.filter((loc) => loc.name !== location.name);
          return { ...idea, selectedLocations: newSelectedLocations };
        }
        return idea;
      })
    );
  };

  const openScriptModal = (savedIdea) => {
    setCurrentIdeaForScript(savedIdea);
    setIsModalOpen(true);
  };

  const handleScriptParamChange = (e) => {
    const { name, value } = e.target;
    setScriptParams((prevParams) => ({ ...prevParams, [name]: value }));
  };

  const handleGenerateScript = async (e) => {
    e.preventDefault();
    if (!currentIdeaForScript) return;
    setLoadingScriptFor(currentIdeaForScript.id);
    setIsModalOpen(false);
    const locationNames = currentIdeaForScript.selectedLocations.map((loc) => loc.name).join(', ');
    const payload = {
      ideaText: currentIdeaForScript.ideaText,
      locationName: locationNames || 'a suitable location',
      ...scriptParams,
    };
    try {
      const response = await fetch(process.env.REACT_APP_N8N_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: payload }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const scriptArray = data[0]?.output?.script || [];
      setSavedIdeas((currentIdeas) =>
        currentIdeas.map((idea) =>
          idea.id === currentIdeaForScript.id
            ? { ...idea, script: scriptArray }
            : idea
        )
      );
    } catch (error) {
      console.error('Error fetching script:', error);
      alert('Failed to fetch script. Check console.');
    }
    setLoadingScriptFor(null);
    setCurrentIdeaForScript(null);
    setScriptParams({ voiceover: 'No', speakers: '1' });
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Idea Generator</h1>
        <div className="input-section">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'A cooking video about pizza'"
          />
          <button onClick={handleGenerateIdeas} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Ideas'}
          </button>
        </div>

        <div className="ideas-section">
          <h2>Generated Ideas</h2>
          {generatedIdeas.map((idea, index) => (
            <div key={index} className="idea-card">
              <p>{idea}</p>
              <button
                className="save-button"
                onClick={() => handleSaveIdea(idea)}
              >
                Save Idea
              </button>
            </div>
          ))}
        </div>

        <div className="saved-section">
          <h2>Saved Plan</h2>
          {savedIdeas.map((savedIdea) => (
            <div key={savedIdea.id} className="saved-idea-card">
              <h3>Idea:</h3>
              <p>{savedIdea.ideaText}</p>

              <button
                className="location-button"
                onClick={() =>
                  handleFindLocations(savedIdea.id, savedIdea.ideaText)
                }
                disabled={loadingLocationFor === savedIdea.id}
              >
                {loadingLocationFor === savedIdea.id
                  ? 'Finding...'
                  : 'Find Locations'}
              </button>

              {savedIdea.generatedLocations.length > 0 && (
                <div className="locations-list">
                  <h4>
                    Suggested Area:{' '}
                    <span className="area-highlight">
                      {savedIdea.suggestedArea}
                    </span>
                  </h4>
                  <p>Select the locations you want to use:</p>
                  {savedIdea.generatedLocations.map((loc, index) => (
                    <div key={index} className="location-item-checkbox">
                      <input
                        type="checkbox"
                        id={`${savedIdea.id}-${index}`}
                        onChange={(e) =>
                          handleLocationSelect(savedIdea.id, loc, e.target.checked)
                        }
                      />
                      <label htmlFor={`${savedIdea.id}-${index}`}>
                        <strong>{loc.name}:</strong> {loc.description}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {savedIdea.selectedLocations.length > 0 &&
                !savedIdea.script?.length && (
                  <button
                    className="script-button"
                    onClick={() => openScriptModal(savedIdea)}
                    disabled={loadingScriptFor === savedIdea.id}
                  >
                    {loadingScriptFor === savedIdea.id
                      ? 'Writing...'
                      : 'Generate Script'}
                  </button>
                )}

              <div className="script-display">
                {savedIdea.script &&
                  savedIdea.script.map((line, index) => (
                    <p key={index} className="script-line">
                      <strong>{line.character}:</strong> {line.line}
                    </p>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </header>

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Script Settings</h2>
            <form onSubmit={handleGenerateScript}>
              <div className="form-group">
                <label>Include Voiceover?</label>
                <select
                  name="voiceover"
                  value={scriptParams.voiceover}
                  onChange={handleScriptParamChange}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>Number of Speakers?</label>
                <input
                  type="number"
                  name="speakers"
                  min="1"
                  max="10"
                  value={scriptParams.speakers}
                  onChange={handleScriptParamChange}
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit">Generate Script</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;