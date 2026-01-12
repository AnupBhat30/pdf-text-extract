# Document Unroller

Look, you've got PDFs and Word docs scattered everywhere and you're sick of copying text manually. This tool extracts all the text from your documents **right in your browser** — no uploading to some sketchy third-party server, no waiting around for slow cloud processing, no privacy concerns. It just works.

## What It Does

- **Actually Good UI:** Not another bloated interface. Clean, minimal design that doesn't make your eyes bleed. Dark mode because who uses light mode anymore?
- **Your Data, Your Computer:** Stop sending files to the cloud like some kind of maniac. Everything runs locally. Your documents never leave your machine.
- **Handles Everything:** PDF, DOCX, TXT, MD, RTF, CSV, JSON, XML, HTML, LOG — if it's text-based, it extracts it.
- **Batch Like a Boss:** Upload multiple files or whole folders at once. No more one-at-a-time nonsense.
- **Respects Dark Mode:** Automatically matches your system settings. Manual toggle if you're feeling rebellious.

## How It's Built

- **Frontend:** Vanilla HTML5, CSS3 (with actual variables, not 2005 styling), vanilla JavaScript (no framework bloat)
- **Libraries:** PDF.js because PDFs are annoying, Mammoth.js for Word documents
- **Builder:** Parcel (fast, zero-config, gets out of your way)

## Development

```bash
npm install
npm run dev
```

Actually runs the dev server. Revolutionary, I know.

## Build for Production

```bash
npm run build
```

Creates an optimized bundle. Better than what you could do manually.

## Deploy It

Vercel handles this automatically. Push to GitHub, Vercel picks up the Parcel config, builds it, deploys it. Done. Stop overthinking this.
