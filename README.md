# BigQuery Release Notes Dashboard

A modern, real-time web application to monitor, parse, and share Google BigQuery release notes. Built with Python Flask on the backend, and Vanilla HTML, CSS, and JavaScript on the frontend.

## 🚀 Features

* **Live RSS Parsing**: Fetches the official Google Cloud BigQuery release feed and splits daily updates into individual, structured records.
* **Modern Glassmorphic UI**: Beautiful dark-theme dashboard designed for fast scanning.
* **Categorized Status Badges**: Updates are color-coded automatically based on category (Features, Issues, Deprecations, and General Updates).
* **One-Click Share to X (Twitter)**: Select any specific release note to auto-generate a tweet draft optimized for character limit rules, hashtags (`#BigQuery #GoogleCloud`), and release URLs.
* **Spinner State Refresh**: Instant on-demand sync with Google's feed.

---

## 🛠️ Technology Stack

* **Backend**: Python 3, Flask, Requests, BeautifulSoup4
* **Frontend**: HTML5 (Semantic structure), Vanilla CSS3 (Custom variables, responsive grid), Vanilla JavaScript (ES6 Fetch and state controllers)

---

## 💻 Quick Start

### Prerequisites

Ensure you have Python installed. You can check with:
```bash
python --version
```

### Installation

1. Clone or navigate to the project workspace directory.
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the Flask server:
   ```bash
   python app.py
   ```
2. Open your web browser and navigate to:
   [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 📂 Project Structure

```text
├── app.py                  # Flask backend & Feed processing parser
├── requirements.txt        # Python dependencies
├── .gitignore              # Git ignore rules for clean check-ins
├── README.md               # Project documentation
├── templates/
│   └── index.html          # Dual-pane dashboard layout
└── static/
    ├── style.css           # Premium dark theme styling
    └── app.js              # State logic, API integrations, and Tweeter client
```
