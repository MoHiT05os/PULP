import { useState } from 'react'

const CUTS = [
  {
    name: 'Study Cut',
    desc: 'Headings and body only. Footnotes and tables stripped.',
  },
  {
    name: 'Research Cut',
    desc: 'Full fidelity — footnotes, tables and structure preserved.',
  },
  {
    name: 'Quote Cut',
    desc: 'Chapter markers and quotable passages only.',
  },
]

const PRESS_OPTIONS = [
  { label: 'Split by chapter (multi-file)', defaultOn: true },
  { label: 'Keep image alt-text', defaultOn: false },
  { label: 'Strip front/back matter', defaultOn: true },
  { label: 'Auto-generate table of contents', defaultOn: true },
]

export default function ThePress() {
  const [activeCut, setActiveCut] = useState(0)
  const [switches, setSwitches] = useState(
    PRESS_OPTIONS.map((opt) => opt.defaultOn)
  )

  const toggleSwitch = (index) => {
    setSwitches((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  return (
    <section id="press">
      <div className="section-head">
        <div className="section-eyebrow">Coming in v2</div>
        <h2>The Press — choose your cut.</h2>
        <p className="section-sub">
          Different cuts of the same book for different jobs. Study notes don't need footnotes.
          Research pipelines need everything.
        </p>
      </div>
      <div className="cuts">
        <div className="cut-list">
          {CUTS.map((cut, i) => (
            <div
              key={i}
              className={`cut-item${i === activeCut ? ' active' : ''}`}
              onClick={() => setActiveCut(i)}
            >
              <div>
                <div className="cut-name">{cut.name}</div>
                <div className="cut-desc">{cut.desc}</div>
              </div>
              <div className="cut-toggle">
                {i === activeCut ? 'SELECTED' : 'SELECT'}
              </div>
            </div>
          ))}
        </div>
        <div className="press-panel">
          {PRESS_OPTIONS.map((opt, i) => (
            <div key={i} className="press-row">
              <div className="press-row-label">{opt.label}</div>
              <div
                className={`switch${switches[i] ? ' on' : ''}`}
                onClick={() => toggleSwitch(i)}
                role="switch"
                aria-checked={switches[i]}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleSwitch(i)
                  }
                }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
