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

  const findArrayInResponse = (data, keyName) => {
    if (!data) return [];
    const output = data[0]?.output || data.output;
    if (output && Array.isArray(output[keyName])) {
      return output[keyName];
    }
    console.warn(`Could not find a valid array with key '${keyName}' in the AI response.`, data);
    return [];
  };

  const handleGenerateIdeas = async () => {
    setLoading(true);
    setGeneratedIdeas([]);
    try {
      const response = await fetch(process.env.REACT_APP_N8N_IDEA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const ideasArray = findArrayInResponse(data, 'ideas');
      setGeneratedIdeas(ideasArray);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      alert('Failed to fetch ideas. Check console.');
    }
    setLoading(false);
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
    setLoadingLocationFor(ideaId);
    try {
      const response = await fetch(process.env.REACT_APP_N8N_LOCATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: ideaText }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const output = data[0]?.output || data.output;
      const suggestedArea = output?.suggestedArea || 'Area not found';
      const locationsArray = output?.locations || [];
      setSavedIdeas((currentIdeas) =>
        currentIdeas.map((idea) =>
          idea.id === ideaId
            ? {
                ...idea,
                generatedLocations: locationsArray,
                suggestedArea: suggestedArea,
              }
            : idea,
        ),
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
      }),
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
    const locationNames = currentIdeaForScript.selectedLocations
      .map((loc) => loc.name)
      .join(', ');
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
      const scriptArray = findArrayInResponse(data, 'script');
      setSavedIdeas((currentIdeas) =>
        currentIdeas.map((idea) =>
          idea.id === currentIdeaForScript.id
            ? { ...idea, script: scriptArray }
            : idea,
        ),
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
    <div className="wrapper">
      <div className="main-header">
        <div className="main-header-logo">
          <div className="logo-header" data-background-color="dark">
            <a href="/" className="logo">
              <span className="navbar-brand fw-bold">Video AI Generator</span>
            </a>
            <div className="nav-toggle">
              <button className="btn btn-toggle toggle-sidebar">
                <i className="gg-menu-right"></i>
              </button>
              <button className="btn btn-toggle sidenav-toggler">
                <i className="gg-menu-right-alt"></i>
              </button>
            </div>
            <button className="topbar-toggler more">
              <i className="gg-more-vertical-alt"></i>
            </button>
          </div>
        </div>
        <nav className="navbar navbar-header navbar-expand-lg" data-background-color="dark">
          <div className="container-fluid">
            <ul className="navbar-nav topbar-nav ms-md-auto align-items-center">
              {/* You can add user profile, notifications here later */}
              <li className="nav-item topbar-user dropdown hidden-caret">
                <a
                  className="dropdown-toggle a-item"
                  data-bs-toggle="dropdown"
                  href="#"
                  aria-expanded="false"
                >
                  <div className="avatar-sm">
                    {/* You can add a user avatar here */}
                    <span className="avatar-title rounded-circle border border-white">VA</span>
                  </div>
                  <span className="user-name">User</span>
                </a>
                <ul className="dropdown-menu dropdown-user animated fadeIn">
                  <div className="dropdown-user-scroll scrollbar-outer">
                    <li>
                      <div className="user-box">
                        <div className="avatar-lg">
                          {/* User avatar or initials */}
                          <span className="avatar-title rounded-circle border border-white">VA</span>
                        </div>
                        <div className="u-text">
                          <h4>User Name</h4>
                          <p className="text-muted">user@example.com</p>
                        </div>
                      </div>
                    </li>
                  </div>
                </ul>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="sidebar sidebar-dark" data-background-color="dark">
        <div className="sidebar-wrapper scrollbar scrollbar-inner">
          <div className="sidebar-content">
            <div className="user">
              <div className="avatar-lg">
                <span className="avatar-title rounded-circle border border-white">VA</span>
              </div>
              <div className="info">
                <a
                  data-bs-toggle="collapse"
                  href="#collapseExample"
                  aria-expanded="true"
                >
                  <span>
                    User Name
                    <span className="user-level">Administrator</span>
                  </span>
                </a>
                <div className="clearfix"></div>
              </div>
            </div>
            <ul className="nav nav-primary">
              <li className="nav-item active">
                <a href="#">
                  <i className="fas fa-home"></i>
                  <p>Dashboard</p>
                </a>
              </li>
              {/* Add more sidebar menu items here as needed */}
            </ul>
          </div>
        </div>
      </div>

      <div className="main-panel">
        <div className="main-content">
          <div className="container-fluid">
            <div className="page-inner">
              <div className="d-flex align-items-left align-items-md-center flex-column flex-md-row pt-2 pb-4">
                <div>
                  <h3 className="fw-bold mb-3">Video Idea Generator</h3>
                  <h6 className="opacity-75 mb-2">Generate and plan your video content!</h6>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="card card-round">
                    <div className="card-header">
                      <div className="card-title">Generate New Ideas</div>
                    </div>
                    <div className="card-body">
                      <div className="input-group mb-3">
                        <textarea
                          className="form-control"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g., 'A cooking video about pizza'"
                          rows="3"
                        ></textarea>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={handleGenerateIdeas}
                        disabled={loading}
                      >
                        {loading ? 'Generating...' : 'Generate Ideas'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card card-round">
                    <div className="card-header">
                      <div className="card-title">Generated Ideas</div>
                    </div>
                    <div className="card-body">
                      {generatedIdeas.length === 0 && !loading && <p>No ideas generated yet.</p>}
                      {generatedIdeas.map((idea, index) => (
                        <div key={index} className="alert alert-secondary d-flex justify-content-between align-items-center" role="alert">
                          {idea}
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSaveIdea(idea)}
                          >
                            Save
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mt-4">
                <div className="col-12">
                  <div className="card card-round">
                    <div className="card-header">
                      <div className="card-title">Saved Video Plans</div>
                    </div>
                    <div className="card-body">
                      {savedIdeas.length === 0 && <p>No plans saved yet. Generate and save an idea above!</p>}
                      {savedIdeas.map((savedIdea) => (
                        <div key={savedIdea.id} className="card mb-3">
                          <div className="card-body">
                            <h5 className="card-title">Idea: {savedIdea.ideaText}</h5>
                            
                            {!savedIdea.generatedLocations.length && (
                              <button
                                className="btn btn-info btn-sm me-2"
                                onClick={() =>
                                  handleFindLocations(savedIdea.id, savedIdea.ideaText)
                                }
                                disabled={loadingLocationFor === savedIdea.id}
                              >
                                {loadingLocationFor === savedIdea.id
                                  ? 'Finding Locations...'
                                  : 'Find Locations'}
                              </button>
                            )}

                            {savedIdea.generatedLocations.length > 0 && (
                              <div className="mt-3">
                                <h6>Suggested Area: <span className="text-primary">{savedIdea.suggestedArea}</span></h6>
                                <p>Select the locations you want to use:</p>
                                <div className="form-group">
                                  {savedIdea.generatedLocations.map((loc, index) => (
                                    <div key={index} className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`location-${savedIdea.id}-${index}`}
                                        onChange={(e) =>
                                          handleLocationSelect(savedIdea.id, loc, e.target.checked)
                                        }
                                        checked={savedIdea.selectedLocations.some(
                                          (selectedLoc) => selectedLoc.name === loc.name
                                        )}
                                      />
                                      <label className="form-check-label" htmlFor={`location-${savedIdea.id}-${index}`}>
                                        <strong>{loc.name}:</strong> {loc.description}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {savedIdea.selectedLocations.length > 0 &&
                             !savedIdea.script?.length && (
                                <button
                                  className="btn btn-warning btn-sm mt-3"
                                  onClick={() => openScriptModal(savedIdea)}
                                  disabled={loadingScriptFor === savedIdea.id}
                                >
                                  {loadingScriptFor === savedIdea.id
                                    ? 'Writing Script...'
                                    : 'Generate Script'}
                                </button>
                              )}

                            {savedIdea.script && savedIdea.script.length > 0 && (
                              <div className="mt-3 card card-dark bg-dark">
                                <div className="card-header">
                                  <div className="card-title text-white">Video Script</div>
                                </div>
                                <div className="card-body">
                                  {savedIdea.script.map((line, index) => (
                                    <p key={index} className="text-white-50 script-line-kai">
                                      <strong>{line.character}:</strong> {line.line}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KaiAdmin Footer */}
        <footer className="footer">
          <div className="container-fluid">
            <nav className="pull-left">
              <ul className="nav">
                <li className="nav-item">
                  <a className="nav-link" href="#">
                    Help
                  </a>
                </li>
              </ul>
            </nav>
            <div className="copyright ms-auto">
              2024, made with <i className="fa fa-heart heart text-danger"></i> by
              <a href="javascript:void(0);"> Your Company Name</a>
            </div>
          </div>
        </footer>
      </div>

      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-labelledby="scriptModalLabel" aria-hidden="true">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="scriptModalLabel">Script Settings</h5>
                <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleGenerateScript}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="voiceover">Include Voiceover?</label>
                    <select
                      className="form-control"
                      id="voiceover"
                      name="voiceover"
                      value={scriptParams.voiceover}
                      onChange={handleScriptParamChange}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="speakers">Number of Speakers?</label>
                    <input
                      type="number"
                      className="form-control"
                      id="speakers"
                      name="speakers"
                      min="1"
                      max="10"
                      value={scriptParams.speakers}
                      onChange={handleScriptParamChange}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Generate Script</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;