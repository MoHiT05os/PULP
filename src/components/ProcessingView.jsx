const STEPS = [
  'Extracting chapters...',
  'Stripping layout noise...',
  'Generating clean Markdown...',
  'Estimating yield...',
]

export default function ProcessingView({ fileName, currentStep, progress }) {
  return (
    <div className="processing-view">
      <div className="processing-filename">{fileName}</div>

      <div className="processing-steps">
        {STEPS.map((step, i) => {
          let className = 'processing-step'
          if (i < currentStep) className += ' done'
          else if (i === currentStep) className += ' active'

          return (
            <div key={i} className={className}>
              <span className="step-indicator"></span>
              {step}
            </div>
          )
        })}
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>

      {/* Animated pulping bars underneath */}
      <div className="stack" style={{ width: '100%', maxWidth: '400px', marginTop: '16px' }}>
        <div className="bar dim"></div>
        <div className="bar red"></div>
        <div className="bar dim"></div>
        <div className="bar"></div>
        <div className="bar red"></div>
        <div className="bar dim"></div>
      </div>
    </div>
  )
}
