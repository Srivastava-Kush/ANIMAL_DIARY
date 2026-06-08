import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadModel, classifyImage } from '../utils/classifier'

export default function IdentifierPage() {
  const navigate = useNavigate()
  const [modelStatus, setModelStatus] = useState('Loading AI model...')
  const [modelReady, setModelReady] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef()
  const classifyImgRef = useRef()

  useEffect(() => {
    loadModel((msg) => setModelStatus(msg))
      .then(() => { setModelStatus('Model ready'); setModelReady(true) })
      .catch(() => setModelStatus('Failed to load model'))
  }, [])

  const handleFile = useCallback((file) => {
    if (!file || !file.type.match(/image\/(jpeg|png)/)) return
    const reader = new FileReader()
    reader.onload = (e) => setImageSrc(e.target.result)
    reader.readAsDataURL(file)
    setResult(null)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleIdentify = useCallback(async () => {
    if (!imageSrc || !modelReady || predicting) return
    setPredicting(true)
    try {
      const res = await classifyImage(classifyImgRef.current)
      setResult(res)
    } catch (err) {
      console.error('Classification error:', err)
    } finally {
      setPredicting(false)
    }
  }, [imageSrc, modelReady, predicting])

  const handleViewOnGlobe = useCallback((animalDiaryName) => {
    navigate('/', { state: { autoShowAnimal: animalDiaryName } })
  }, [navigate])

  const handleReset = useCallback(() => {
    setImageSrc(null)
    setResult(null)
  }, [])

  return (
    <div className="identifier-page">
      {/* Hidden img used solely for TFjs classification — always mounted when image is loaded */}
      {imageSrc && (
        <img
          ref={classifyImgRef}
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="identifier-hidden-img"
          crossOrigin="anonymous"
        />
      )}

      <div className="identifier-stars" aria-hidden="true" />

      <header className="identifier-header">
        <button className="identifier-back" onClick={() => navigate('/')}>
          &#8592; Back
        </button>
        <div className="identifier-header-center">
          <h1 className="identifier-title">&#x1F412; Indian Primate Identifier</h1>
          <p className="identifier-subtitle">Powered by TensorFlow.js &mdash; runs entirely in your browser</p>
        </div>
        <div className={`identifier-model-status${modelReady ? ' ready' : ''}`}>
          {modelReady ? '● Model Ready' : modelStatus}
        </div>
      </header>

      <main className="identifier-main">
        {!result ? (
          <section className="identifier-upload-section">
            <div
              className={`identifier-dropzone${dragging ? ' dragging' : ''}${imageSrc ? ' has-image' : ''}`}
              onClick={() => !imageSrc && fileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {imageSrc ? (
                <>
                  <img src={imageSrc} alt="uploaded primate" className="identifier-preview-img" />
                  <button
                    className="identifier-change-img"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current.click() }}
                  >
                    Change image
                  </button>
                </>
              ) : (
                <div className="identifier-dropzone-placeholder">
                  <span className="identifier-upload-icon">&#x1F5BC;&#xFE0F;</span>
                  <p>Drop a primate photo here or click to upload</p>
                  <span className="identifier-upload-hint">JPG or PNG</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <button
              className={`identifier-identify-btn${(!imageSrc || !modelReady || predicting) ? ' disabled' : ''}`}
              onClick={handleIdentify}
              disabled={!imageSrc || !modelReady || predicting}
            >
              {predicting ? (
                <span className="identifier-spinner-wrap">
                  <span className="identifier-spinner" />
                  Analysing image...
                </span>
              ) : 'Identify Species'}
            </button>
          </section>
        ) : (
          <section className="identifier-results">
            <div className="identifier-result-img-wrap">
              <img src={imageSrc} alt="uploaded" className="identifier-result-img" />
            </div>

            {result.status === 'confident'
              ? <ConfidentResult result={result} onViewGlobe={handleViewOnGlobe} />
              : <UncertainResult result={result} />
            }

            <AllBars results={result.all} />

            <button className="identifier-try-another" onClick={handleReset}>
              Try Another Image
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

function ConfidentResult({ result, onViewGlobe }) {
  const { top } = result
  const pct = Math.round(top.probability * 100)

  return (
    <div className="identifier-confident">
      <div className="identifier-confident-row">
        <div className="identifier-confident-info">
          <h2 className="identifier-species-name">{top.info.common}</h2>
          <p className="identifier-species-scientific">{top.info.scientific}</p>
          <span className="identifier-status-badge" style={{ background: top.info.statusColor }}>
            {top.info.status}
          </span>
          <p className="identifier-habitat">&#x1F4CD; {top.info.habitat}</p>
          <p className="identifier-description">{top.info.description}</p>
          <button
            className="identifier-globe-btn"
            onClick={() => onViewGlobe(top.info.animalDiaryName)}
          >
            &#x1F30D; View on Globe
          </button>
        </div>
        <div className="identifier-confidence-ring">
          <ConfidenceRing pct={pct} color={top.info.statusColor} />
          <div className="identifier-confidence-text">
            <span className="identifier-confidence-pct">{pct}%</span>
            <span className="identifier-confidence-sub">confidence</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfidenceRing({ pct, color }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <svg className="identifier-ring-svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} className="identifier-ring-track" />
      <circle
        cx="50" cy="50" r={r}
        className="identifier-ring-fill"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ / 4}
        style={{ stroke: color }}
      />
    </svg>
  )
}

function UncertainResult({ result }) {
  const top2 = result.all.slice(0, 2)
  return (
    <div className="identifier-uncertain">
      <h2 className="identifier-uncertain-title">Unable to identify with confidence</h2>
      <p className="identifier-uncertain-hint">Try a clearer photo with the animal&apos;s face fully visible</p>
      <div className="identifier-top2">
        {top2.map(({ species, info, probability }) => (
          <div key={species} className="identifier-top2-item">
            <span className="identifier-top2-name">{info.common}</span>
            <span className="identifier-top2-pct">{Math.round(probability * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AllBars({ results }) {
  return (
    <div className="identifier-bars">
      <h3 className="identifier-bars-title">All Species Probabilities</h3>
      {results.map(({ species, info, probability }) => {
        const pct = Math.round(probability * 100)
        return (
          <div key={species} className="identifier-bar-row">
            <span className="identifier-bar-label">{info.common}</span>
            <div className="identifier-bar-track">
              <div
                className="identifier-bar-fill"
                style={{ width: `${Math.max(pct, 1)}%`, background: info.statusColor }}
              />
            </div>
            <span className="identifier-bar-pct">{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}
