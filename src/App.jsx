import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [scanType, setScanType] = useState('SMS')
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('scamShieldHistory')
      return savedHistory ? JSON.parse(savedHistory) : []
    } catch {
      return []
    }
  })

  // Save scan history automatically
  useEffect(() => {
    localStorage.setItem(
      'scamShieldHistory',
      JSON.stringify(history)
    )
  }, [history])

  // Dashboard statistics
  const totalScans = history.length

  const threatsDetected = history.filter(
    (item) =>
      item.riskLevel === 'High' ||
      item.riskLevel === 'Medium'
  ).length

  const safeResults = history.filter(
    (item) => item.riskLevel === 'Low'
  ).length

  // Gemini AI scanning function
  const handleScan = async (e) => {
    e.preventDefault()

    if (!input.trim()) {
      setError('Please enter a message or URL first.')
      setResult(null)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(
        'https://scamshield-8vlu.onrender.com/api/ai-scan',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: input.trim(),
            type: scanType
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'AI scanning failed.'
        )
      }

      const aiResult = data.result

      if (
        !aiResult ||
        typeof aiResult.riskScore !== 'number' ||
        !Number.isFinite(aiResult.riskScore) ||
        !['Low', 'Medium', 'High'].includes(
          aiResult.riskLevel
        )
      ) {
        throw new Error('Invalid AI response received.')
      }

      const normalizedResult = {
        riskScore: Math.max(
          0,
          Math.min(100, aiResult.riskScore)
        ),

        riskLevel: aiResult.riskLevel,

        reasons: Array.isArray(aiResult.reasons)
          ? aiResult.reasons
          : [],

        recommendations: Array.isArray(
          aiResult.recommendations
        )
          ? aiResult.recommendations
          : [],

        summary: aiResult.summary || '',

        detectedUrls: [],

        disclaimer:
          'AI-generated assessment. Always verify suspicious messages independently.',

        scanType: scanType
      }

      setResult(normalizedResult)

      setHistory((previous) => [
        {
          ...normalizedResult,
          id: Date.now(),
          date: new Date().toLocaleString()
        },
        ...previous
      ])

    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Make sure your server is running on port 5000.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">S</div>

          <div>
            <h2>Scam Shield</h2>
            <span>Digital Safety Platform</span>
          </div>
        </div>

        <p className="nav-heading">MENU</p>

        <nav>
          <a className="nav-item active" href="#dashboard">
            ▦ Dashboard
          </a>

          <a className="nav-item" href="#scanner">
            ⌕ Scam Scanner
          </a>

          <a className="nav-item" href="#activity">
            ◷ Scan History
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="shield-small">✓</div>
          <h3>Stay Protected</h3>
          <p>Think before you click. Stay safe online.</p>
        </div>

      </aside>

      {/* MAIN DASHBOARD */}
      <main className="main">

        <header className="topbar">
          <div>
            <span className="breadcrumb">
              Workspace / Dashboard
            </span>

            <h1>Security Dashboard</h1>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            Protection Workspace
          </div>
        </header>

        {/* WELCOME SECTION */}
        <section className="welcome" id="dashboard">

          <div>
            <span className="eyebrow">
              YOUR DIGITAL SAFETY COMPANION
            </span>

            <h2>Welcome to Scam Shield</h2>

            <p>
              Check suspicious messages, emails and links before
              you trust them.
            </p>
          </div>

          <div className="welcome-icon">🛡️</div>

        </section>

        {/* STATISTICS */}
        <section className="stats">

          <div className="stat-card">
            <span className="stat-label">Total Scans</span>
            <h2>{totalScans}</h2>
            <p>Scans completed</p>
          </div>

          <div className="stat-card">
            <span className="stat-label">Threats Detected</span>
            <h2>{threatsDetected}</h2>
            <p>Medium and high-risk results</p>
          </div>

          <div className="stat-card">
            <span className="stat-label">Low-Risk Results</span>
            <h2>{safeResults}</h2>
            <p>Low-risk assessments</p>
          </div>

        </section>

        {/* SCANNER */}
        <section className="scanner-card" id="scanner">

          <div className="section-title">

            <div>
              <span className="eyebrow">SECURITY CHECK</span>
              <h2>Scan for Scams</h2>
              <p>Choose what you want to analyse.</p>
            </div>

            <span className="scanner-icon">⌕</span>

          </div>

          {/* SCAN TYPE TABS */}
          <div className="scan-tabs">

            {['SMS', 'Email', 'URL'].map((type) => (

              <button
                key={type}
                type="button"
                className={
                  scanType === type
                    ? 'tab active-tab'
                    : 'tab'
                }
                onClick={() => {
                  setScanType(type)
                  setInput('')
                  setResult(null)
                  setError('')
                }}
              >
                {type === 'SMS'
                  ? '✉'
                  : type === 'Email'
                    ? '▣'
                    : '↗'}

                {' '}{type}

              </button>

            ))}

          </div>

          {/* INPUT FORM */}
          <form onSubmit={handleScan}>

            <label htmlFor="scan-input">

              {scanType === 'URL'
                ? 'Paste the suspicious website link'
                : scanType === 'Email'
                  ? 'Paste the suspicious email'
                  : 'Paste the suspicious SMS or message'}

            </label>

            <textarea
              id="scan-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                scanType === 'URL'
                  ? 'https://example.com'
                  : 'Paste your suspicious content here...'
              }
              rows="6"
              maxLength={5000}
            />

            <div className="form-footer">

              <span>
                Do not enter passwords or sensitive personal data.
              </span>

              <button
                type="submit"
                className="scan-button"
                disabled={loading}
              >
                {loading
                  ? 'Analysing...'
                  : 'Analyse Input →'}
              </button>

            </div>

          </form>

          {/* ERROR MESSAGE */}
          {error && (
            <div
              className="feedback error-message"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* SCAN RESULTS */}
          {result && (

            <div className="result-card">

              <span className="eyebrow">
                AI SCAN RESULTS
              </span>

              <h2>
                {result.riskLevel === 'High'
                  ? 'High Risk Detected'
                  : result.riskLevel === 'Medium'
                    ? 'Potential Warning'
                    : 'Low Risk Assessment'}
              </h2>

              <div className="result-score">
                <span>Risk Score</span>
                <strong>
                  {result.riskScore}/100
                </strong>
              </div>

              <div className="score-track">

                <div
                  className={`score-fill ${result.riskLevel.toLowerCase()}`}
                  style={{
                    width: `${result.riskScore}%`
                  }}
                ></div>

              </div>

              <p
                className={`risk-label ${result.riskLevel.toLowerCase()}`}
              >
                Risk Level: {result.riskLevel}
              </p>

              {result.summary && (
                <>
                  <h3>AI Analysis</h3>
                  <p>{result.summary}</p>
                </>
              )}

              <h3>Detection Reasons</h3>

              <ul className="reason-list">

                {result.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}

              </ul>

              {/* SAFETY RECOMMENDATIONS */}
              <div className="recommendations">

                <h3>🛡️ Safety Recommendations</h3>

                {result.recommendations.length > 0 ? (

                  <ul>
                    {result.recommendations.map(
                      (item, index) => (
                        <li key={index}>{item}</li>
                      )
                    )}
                  </ul>

                ) : (

                  <p>
                    Stay alert and verify unexpected messages.
                  </p>

                )}

              </div>

              {result.detectedUrls.length > 0 && (

                <>
                  <h3>URLs Found</h3>

                  <ul className="reason-list">

                    {result.detectedUrls.map(
                      (url, index) => (
                        <li key={index}>{url}</li>
                      )
                    )}

                  </ul>
                </>

              )}

              <p className="disclaimer">
                {result.disclaimer}
              </p>

            </div>

          )}

        </section>

        {/* SCAN HISTORY */}
        <section className="activity-card" id="activity">

          <div className="activity-heading">

            <div>
              <h2>Recent Activity</h2>
              <p>Your latest security checks.</p>
            </div>

            <span className="history-icon">◷</span>

          </div>

          {history.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">⌕</div>

              <h3>No activity yet</h3>

              <p>
                Your scan history will appear here after analysis.
              </p>

            </div>

          ) : (

            <div className="history-list">

              {history.map((item) => (

                <div
                  className="history-item"
                  key={item.id}
                >

                  <div>
                    <strong>{item.scanType} Scan</strong>
                    <p>{item.date}</p>
                  </div>

                  <span
                    className={`risk-label ${item.riskLevel.toLowerCase()}`}
                  >
                    {item.riskLevel} · {item.riskScore}/100
                  </span>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* FOOTER */}
        <footer>
          <span>SCAM SHIELD</span>
          <span>Detect. Protect. Stay Safe.</span>
        </footer>

      </main>

    </div>
  )
}

export default App