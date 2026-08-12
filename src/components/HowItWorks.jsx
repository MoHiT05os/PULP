export default function HowItWorks() {
  return (
    <section id="how">
      <div className="section-head">
        <div className="section-eyebrow">Process</div>
        <h2>Three steps. No account.</h2>
        <p className="section-sub">
          Nothing about this needs a dashboard. Drop a file, watch it get pulped, take the file with you.
        </p>
      </div>
      <div className="steps">
        <div className="step">
          <div className="step-num">01 / DROP</div>
          <h3>Load the book</h3>
          <p>
            Drag in an EPUB or PDF. It's read into memory in your browser — nothing is sent anywhere.
          </p>
        </div>
        <div className="step">
          <div className="step-num">02 / DISTILL</div>
          <h3>Strip the noise</h3>
          <p>
            Layout XML, running headers, page numbers and embedded fonts are removed.
            Headings, chapters and paragraphs stay intact.
          </p>
        </div>
        <div className="step">
          <div className="step-num">03 / DOWNLOAD</div>
          <h3>Take your .md</h3>
          <p>
            One file, plain Markdown, ready to paste into any AI tool or RAG pipeline — with the token math to prove the savings.
          </p>
        </div>
      </div>
    </section>
  )
}
