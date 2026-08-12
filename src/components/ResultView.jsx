import { formatSize } from '../utils/tokenCounter'

export default function ResultView({ yieldData, markdown, fileName, onReset }) {
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    // Generate output filename: replace extension with .md
    const baseName = fileName.replace(/\.(epub|pdf)$/i, '')
    a.href = url
    a.download = `${baseName}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const previewText = markdown.length > 5000
    ? markdown.slice(0, 5000) + '\n\n... [Preview truncated — full content in download]'
    : markdown

  return (
    <>
      {/* Yield Stats */}
      <div className="yield">
        <div className="yield-stat">
          <div className="label">Source</div>
          <div className="val">{formatSize(yieldData.originalSize)} {yieldData.fileType}</div>
        </div>
        <div className="yield-stat">
          <div className="label">Output</div>
          <div className="val">{formatSize(yieldData.outputSize)} .md</div>
        </div>
        <div className="yield-stat">
          <div className="label">Est. tokens before</div>
          <div className="val">~{yieldData.originalTokens.toLocaleString()}</div>
        </div>
        <div className="yield-stat">
          <div className="label">Est. tokens after</div>
          <div className="val red">~{yieldData.cleanedTokens.toLocaleString()}</div>
        </div>
        <div className="yield-stat">
          <div className="label">Yield</div>
          <div className="val red">−{yieldData.reduction}%</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="result-actions">
        <button className="btn primary" onClick={handleDownload}>
          Download .md
        </button>
        <button className="link-quiet" onClick={onReset}>
          Distill another
        </button>
      </div>

      {/* Markdown Preview */}
      <div className="md-preview-container">
        <div className="md-preview-header">Output preview</div>
        <pre className="md-preview">{previewText}</pre>
      </div>

      {/* Copyright note */}
      <div className="copyright-note">
        For personal/research use. Respect copyright when sharing derived content.
      </div>
    </>
  )
}
