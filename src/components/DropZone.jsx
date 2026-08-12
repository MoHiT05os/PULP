import { useRef, useState, useCallback } from 'react'

export default function DropZone({ onFileSelected }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndEmit(files[0])
    }
  }, [onFileSelected])

  const handleFileChange = useCallback((e) => {
    if (e.target.files.length > 0) {
      validateAndEmit(e.target.files[0])
    }
  }, [onFileSelected])

  const validateAndEmit = (file) => {
    const name = file.name.toLowerCase()
    if (name.endsWith('.epub') || name.endsWith('.pdf')) {
      onFileSelected(file)
    } else {
      alert('PULP only accepts .epub and .pdf files.')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`dropzone${isDragOver ? ' drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Drop an EPUB or PDF file to convert"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      <div className="dash"></div>
      <div className="dz-icon">＋</div>
      <div className="dz-title">Drop an EPUB or PDF</div>
      <div className="dz-meta">.EPUB &nbsp;·&nbsp; .PDF &nbsp;—&nbsp; NEVER LEAVES YOUR BROWSER</div>
      <input
        ref={fileInputRef}
        type="file"
        className="dz-file-input"
        accept=".epub,.pdf"
        onChange={handleFileChange}
      />
    </div>
  )
}
