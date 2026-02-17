# Invoice Generator 🧾✨

A modern, AI-powered invoice generator built for freelancers and small businesses. accessible offline and privacy-focused.

![App Screenshot](docs/assets/dashboard-preview.png)

## � Screenshots

| Dashboard | AI Integration |
|:---:|:---:|
| <img src="docs/assets/dashboard-preview.png" width="400" /> | <img src="docs/assets/ai-assistant.png" width="400" /> |

## �🚀 Features

- **🤖 AI-Powered**: Uses Google Gemini AI to auto-complete client details and suggest product descriptions.
- **🔒 100% Offline & Private**: All data is stored locally on your device. No cloud uploads, no data leaks.
- **⚡ Smart Autocomplete**: Remembers your clients and products for lightning-fast invoicing.
- **📄 Professional PDFs**: Generate clean, professional PDF invoices instantly.
- **📊 Excel/CSV Export**: Export your entire invoice history for accounting and record-keeping.
- **🎨 Glassmorphism UI**: A beautiful, modern interface designed for ease of use.
- **📱 Responsive Design**: Works seamlessly on desktop and mobile.

## 🛠️ Tech Stack

- **Framework**: [Tauri](https://tauri.app/) (v2)
- **Frontend**: [React](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: Native browser print API

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/VJNAVEEN2005/Invoice-Generator.git
    cd Invoice-Generator
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run in Development Mode**
    ```bash
    npm run tauri dev
    ```

4.  **Build for Production**
    ```bash
    npm run tauri build
    ```

## 🤖 Setting up AI (Optional)

To enable the AI features (autocomplete, suggestions), you need a free Google Gemini API key.

1.  Get your key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Open the App.
3.  Go to **Settings** -> **AI Integration**.
4.  Paste your API Key.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

Made with ❤️ by [VJNAVEEN2005](https://github.com/VJNAVEEN2005)
