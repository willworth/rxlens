# RxLens (CPIC Translator)

A lightweight, purely client-side tool that parses 23andMe raw data files and translates them into a clinician-ready Pharmacogenomics (PGx) report. 

It maps your star alleles to published clinical guidelines ([CPIC](https://cpicpgx.org)) for 5 key genes and generates a traffic-light PDF you can hand to your GP.

## Why this exists

I wrote a detailed essay on why I built this tool, and more importantly, why **you shouldn't use a hosted version of it.**

Read the article here: [I Built a Pharmacogenomics Tool in 12 Minutes. I Wouldn't Use It.](https://willworth.dev/pharmacogenomics)

The core thesis: For sensitive medical software, the old model is "trust the institution." The new model is **Software as Recipe**. Don't upload your genetic data to my website. Read the code (or have your AI agent audit it), verify it runs locally, and execute it on your own machine.

## How to use it (The Recipe)

### 1. Audit
Look at the source code. The entire application runs in the browser. No data is sent to any server. The core star allele calling logic is in `src/lib/pgx-engine.ts`. 

### 2. Run Locally
You will need Node.js and `pnpm` installed.

```bash
# Clone the repository
git clone https://github.com/willworth/rxlens.git
cd rxlens

# Install dependencies
pnpm install

# Start the local development server
pnpm dev
```
Open `http://localhost:3000` in your browser. 

### 3. Generate your report
Upload your raw 23andMe `.txt` data file. The application will parse the SNPs, determine your star alleles (for the variants it covers), and generate a PDF report.

## Clinical Disclaimer & Limitations
This tool covers common variants only. **CYP2D6** — the most clinically dangerous gene in the panel — cannot be fully called from consumer array data like 23andMe because structural variants (gene deletions, duplications, hybrid alleles) require sequencing. 

The tool explicitly flags this limitation. If it shows you a CYP2D6 result, treat it as preliminary. **Always confirm with clinical-grade testing before making any medical decisions.** This tool is for informational purposes and to facilitate a conversation with your healthcare provider.

## Tech Stack
* Next.js (React)
* Tailwind CSS
* `@react-pdf/renderer` (for purely client-side PDF generation)

## Contributing
If you spot an error in the allele calling logic (`src/lib/pgx-engine.ts`) or want to add support for more genes, please open an issue or submit a pull request. The code is the trust.
