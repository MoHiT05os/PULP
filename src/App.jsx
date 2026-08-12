import { useState, useCallback, useRef } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import DropZone from './components/DropZone'
import ProcessingView from './components/ProcessingView'
import ResultView from './components/ResultView'
import HowItWorks from './components/HowItWorks'
import ThePress from './components/ThePress'
import Privacy from './components/Privacy'

import { parseEpub } from './parsers/epubParser'
import { parsePdf } from './parsers/pdfParser'
import { cleanMarkdown } from './parsers/markdownSerializer'
import { countTokens, estimateFileSize, calculateYield } from './utils/tokenCounter'

/**
 * App states:
 *  - idle:       Show landing page with dropzone
 *  - processing: File is being parsed
 *  - result:     Conversion complete, show yield + download
 *  - error:      Something went wrong
 */

export default function App() {
  const [appState, setAppState] = useState('idle')
  const [fileName, setFileName] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [markdown, setMarkdown] = useState('')
  const [yieldData, setYieldData] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const labRef = useRef(null)

  const scrollToLab = () => {
    labRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleFileSelected = useCallback(async (file) => {
    setFileName(file.name)
    setAppState('processing')
    setCurrentStep(0)
    setProgress(0)
    setErrorMsg('')

    // Scroll to the lab area so user can see the processing
    setTimeout(scrollToLab, 100)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const fileType = file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'pdf'
      const originalSize = file.size

      // Step 0: Extracting chapters
      setCurrentStep(0)
      setProgress(10)

      let parseResult
      if (fileType === 'epub') {
        parseResult = await parseEpub(arrayBuffer)
        setProgress(50)
      } else {
        parseResult = await parsePdf(arrayBuffer, (current, total) => {
          const pct = Math.round((current / total) * 40) + 10
          setProgress(pct)
        })
      }

      // Step 1: Stripping layout noise
      setCurrentStep(1)
      setProgress(60)
      await tick()

      // Step 2: Generating clean Markdown
      setCurrentStep(2)
      setProgress(75)
      const cleaned = cleanMarkdown(parseResult.markdown)
      await tick()

      // Step 3: Estimating yield
      setCurrentStep(3)
      setProgress(90)

      // Count tokens for both raw and cleaned text
      const [rawTokens, cleanedTokens] = await Promise.all([
        countTokens(parseResult.rawTextLength > 0
          ? 'x'.repeat(Math.min(parseResult.rawTextLength, 100000))
          : cleaned
        ).catch(() => Math.round(parseResult.rawTextLength / 4)),
        countTokens(cleaned).catch(() => Math.round(cleaned.length / 4)),
      ])

      // Use a realistic estimate for "before" tokens based on raw text length
      const estimatedOriginalTokens = Math.round(parseResult.rawTextLength / 3.5)
      const outputSize = estimateFileSize(cleaned)
      const yieldResult = calculateYield(estimatedOriginalTokens, cleanedTokens)

      setProgress(100)
      await tick()

      setMarkdown(cleaned)
      setYieldData({
        originalSize,
        outputSize,
        originalTokens: estimatedOriginalTokens,
        cleanedTokens,
        reduction: yieldResult.reduction,
        fileType: `.${fileType}`,
      })
      setAppState('result')
    } catch (err) {
      console.error('PULP conversion error:', err)
      setErrorMsg(err.message || 'Something went wrong during conversion.')
      setAppState('error')
    }
  }, [])

  const handleReset = useCallback(() => {
    setAppState('idle')
    setFileName('')
    setCurrentStep(0)
    setProgress(0)
    setMarkdown('')
    setYieldData(null)
    setErrorMsg('')
  }, [])

  const handleDistillClick = () => {
    // Scroll to the dropzone
    labRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      <Header />

      <main className="wrap">
        {/* Hero Section */}
        <section className="hero" style={{ borderTop: 'none', paddingBottom: 0 }}>
          <div className="eyebrow reveal">EPUB / PDF → clean markdown</div>
          <h1 className="headline reveal d1">
            Books,<br />
            <span className="accent">distilled.</span>
          </h1>
          <p className="sub-text reveal d2">
            Turn any EPUB or PDF into lean, structured Markdown — built for
            feeding real books into AI models without burning your context window
            on layout noise. Processed entirely on your device.
          </p>

          <div className="hero-actions reveal d3">
            <button className="btn primary" onClick={handleDistillClick}>
              Distill a book
            </button>
            <a href="#how" className="link-quiet">
              See how it works
            </a>
          </div>

          {/* The Lab — conversion area */}
          <div className="lab reveal d3" ref={labRef}>
            {appState === 'idle' && (
              <>
                <DropZone onFileSelected={handleFileSelected} />
                <div className="press-viz">
                  <div className="press-viz-label">Pulping in progress</div>
                  <div className="stack">
                    <div className="bar dim"></div>
                    <div className="bar red"></div>
                    <div className="bar dim"></div>
                    <div className="bar"></div>
                    <div className="bar red"></div>
                    <div className="bar dim"></div>
                  </div>
                </div>
                {/* Static yield preview */}
                <div className="yield">
                  <div className="yield-stat">
                    <div className="label">Source</div>
                    <div className="val">4.8 MB epub</div>
                  </div>
                  <div className="yield-stat">
                    <div className="label">Output</div>
                    <div className="val">312 KB .md</div>
                  </div>
                  <div className="yield-stat">
                    <div className="label">Est. tokens before</div>
                    <div className="val">~46,200</div>
                  </div>
                  <div className="yield-stat">
                    <div className="label">Est. tokens after</div>
                    <div className="val red">~11,400</div>
                  </div>
                  <div className="yield-stat">
                    <div className="label">Yield</div>
                    <div className="val red">−75%</div>
                  </div>
                </div>
              </>
            )}

            {appState === 'processing' && (
              <ProcessingView
                fileName={fileName}
                currentStep={currentStep}
                progress={progress}
              />
            )}

            {appState === 'result' && yieldData && (
              <ResultView
                yieldData={yieldData}
                markdown={markdown}
                fileName={fileName}
                onReset={handleReset}
              />
            )}

            {appState === 'error' && (
              <>
                <div className="error-message">
                  <span>✕</span>
                  <span>{errorMsg}</span>
                </div>
                <div className="result-actions">
                  <button className="btn primary" onClick={handleReset}>
                    Try again
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Info Sections */}
        <HowItWorks />
        <ThePress />
        <Privacy />
      </main>

      <Footer />
    </>
  )
}

/** Small helper to yield to the event loop (allows React to re-render) */
function tick() {
  return new Promise((resolve) => setTimeout(resolve, 50))
}
