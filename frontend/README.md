# CareerRise Frontend

Vite + React interface for the CareerRise Economic Mobility Dashboard. The app now includes a **CareerBot** experience to explore Atlanta career pathways across IT, construction, manufacturing, transportation/logistics, and healthcare.

## Getting Started

```bash
cd frontend
npm install
npm run dev
```

Visit the URL printed in the console (typically `http://localhost:5173`).

## Configuring CareerBot

1. Create `frontend/.env` if it does not exist and add your OpenAI key:
   ```
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```
2. Restart the Vite dev server (`npm run dev`) after adding or updating the key.

If no key is present the CareerBot page will stay disabled and display setup instructions.

## Project Structure

- `src/pages/CareerBot.jsx` – chatbot page with UI + message handling
- `src/services/careerBotClient.js` – helper that calls OpenAI’s chat completions API
- `src/components/NavBar.jsx` – navigation with the new CareerBot tab

## Troubleshooting

- Ensure the `.env` file is **not** committed; it is ignored via `.gitignore`.
- If the chatbot shows an error bubble, double-check the API key and that the OpenAI account has quota.
- For linting, run `npm run lint`. (Existing lint warnings from generated assets can be ignored.)
