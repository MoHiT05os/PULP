<div align="center">
  <h1>🟥 PULP</h1>
  <p>
    <strong>Books, distilled.</strong>
    <br />
    Turn any EPUB or PDF into lean, structured Markdown — built for feeding real books into AI models without burning your context window on layout noise. Processed entirely on your device.
  </p>
</div>

<br />

<div align="center">
  <img src="Screenshot 2026-08-12 110251.png" alt="PULP UI Preview" width="100%" style="border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.5);">
</div>

<br />

## ✨ Features

- **Local-First & Private**: Everything happens in your browser. No files are uploaded to any server. Your books stay yours.
- **EPUB & PDF Support**: Extracts text, headings, and structure while stripping away layout noise, styles, and running headers.
- **Token Yield Estimation**: Built-in accurate token calculation (using OpenAI's `cl100k_base` BPE) to show exactly how much context space you're saving before feeding it to an LLM.
- **TRMY Design Language**: Beautiful, minimal, dark-mode aesthetic with brutalist accents (`#0A0A0A` surfaces, `#FF3B30` core red).
- **Fast & Lightweight**: Built with Vite, React, `fflate`, and `pdfjs-dist`.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MoHiT05os/PULP.git
   cd PULP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## 🛠️ Built With

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [pdf.js](https://mozilla.github.io/pdf.js/) - Client-side PDF parsing
- [fflate](https://github.com/101arrowz/fflate) - Lightning-fast zip extraction for EPUBs
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion
- [gpt-tokenizer](https://github.com/niieani/gpt-tokenizer) - Client-side token estimation

## 📝 License

This project is open-source and available under the standard MIT License.
