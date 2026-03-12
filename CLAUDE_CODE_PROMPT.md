# Claude Code Kickoff Prompt

Copy and paste this exactly to start your first Claude Code session.
After pasting, also add the PRODUCT.md, FEATURES.md, ARCHITECTURE.md, and SESSIONS.md files to your project root so Claude Code can reference them throughout the build.

---

## PROMPT (copy everything below this line)

---

We are building a job search copilot web app. Before doing anything, read the following project files in the root of this project:
- PRODUCT.md
- FEATURES.md
- ARCHITECTURE.md
- SESSIONS.md

This is Session 1. Your job is only to complete Session 1 as defined in SESSIONS.md. Do not build anything beyond that scope.

### What to build in this session

Set up a Next.js 14 app using the App Router with Tailwind CSS.

The app is a single-page UI with three tabs across the top:
1. **Profile** (active by default)
2. **Job Fit**
3. **Tailoring Brief**

For now, only build the Profile tab. The other two tabs can show a placeholder that says "Complete your profile first."

### Profile tab requirements

The Profile tab should have two input options — the user picks one:

**Option A: Upload a file**
- Accept PDF or DOCX files only
- On upload, call a server-side API route at `/api/parse-resume`
- That route extracts the plain text from the file using:
  - `pdf-parse` for PDF files
  - `mammoth` for DOCX files
- Return the plain text to the client
- Display the extracted text in a read-only text area on screen (so I can confirm it worked)

**Option B: Paste text**
- A large text area where the user pastes their resume text directly
- No API call needed — just capture the text in state

Below both input options, show a "Confirm Profile" button that:
- Is disabled until text exists (either from file or paste)
- When clicked, saves the profile text to React state
- Shows a success message: "Profile loaded. Ready to score jobs."

### Technical requirements

- Follow the folder structure in ARCHITECTURE.md exactly
- Store all prompts in `/lib/prompts.ts` (even though no Claude calls happen this session)
- Store the Anthropic client init in `/lib/anthropic.ts` (even though it won't be called yet)
- Use TypeScript throughout
- Include a `.env.local.example` with `ANTHROPIC_API_KEY=` as the only variable
- Add a loading spinner while file parsing is in progress
- Handle errors: if file parsing fails, show an inline error message and let the user try again

### Do not build yet

- Do not connect to Claude API this session
- Do not build the Job Fit tab functionality
- Do not build the Tailoring Brief tab functionality
- Do not add a database, auth, or any persistence beyond React state

### When you are done

Confirm:
- The app runs locally with `npm run dev`
- File upload works for both PDF and DOCX
- Text paste works
- Extracted text renders on screen
- The "Confirm Profile" button activates correctly

Then stop and tell me Session 1 is complete and what to expect in Session 2.
