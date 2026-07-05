# 📊 BigQuery Release Notes Dashboard

A beautiful, premium web application built using **Python Flask** and **Vanilla HTML, CSS, and JavaScript**. The dashboard parses the official Google Cloud BigQuery release notes XML feed, categories them, and provides a polished interface for reading and sharing individual updates to Twitter/X.

![Google Cloud BigQuery](https://img.shields.io/badge/Google%20Cloud-BigQuery-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![Python Flask](https://img.shields.io/badge/Python-Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## ✨ Features

* **🔄 RSS Feed Parser & Smart Cache:** Fetches updates directly from the official BigQuery release notes XML feed. The Python backend breaks the daily release groups into single updates (Features, Fixes, Changes, etc.) using `BeautifulSoup` and stores them in a local cache for instant loading.
* **🎛️ Live Search & Sidebar Filters:** Real-time keyword search across dates and content. Checkboxes in the sidebar allow filtering by update type:
  * 🟢 **Features**
  * 🔵 **Changes**
  * 🟢 **Fixes**
  * 🔴 **Deprecations**
  * 🟡 **Announcements**
* **🐦 Custom Twitter/X Composer Modal:** Click the Tweet button next to any update to open a custom composer. Features a circular character counter (similar to X's real composer) that tracks the 280-character limit and pre-formats the tweet with metadata.
* **✨ "Tweet Selection" (Floating Widget):** Highlight any text within the release notes, and a floating **Tweet Selection** button will appear above your cursor to instantly tweet the quote.
* **🎨 High-End Aesthetics:** Premium dark-mode theme utilizing Google Fonts (`Outfit` & `Inter`), sleek gradients, custom scrollbars, glowing border states, and smooth CSS micro-animations.

---

## 🚀 Getting Started

### 📋 Prerequisites
You need **Python 3.x** installed. The project relies on the following dependencies:
* `flask`
* `feedparser`
* `beautifulsoup4`

### 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Arnish-val/Arnish-Raj-talks-app-.git
   cd Arnish-Raj-talks-app-
   ```

2. **Install dependencies:**
   ```bash
   pip install flask feedparser beautifulsoup4
   ```

3. **Run the Flask server:**
   ```bash
   python app.py
   ```

4. **Open the web application:**
   Go to [http://127.0.0.1:5000](http://127.0.0.1:5000) in your web browser.

---

## 📂 Project Structure

```text
Arnish-Raj-talks-app-/
├── app.py                  # Python Flask server & RSS parser
├── README.md               # Project documentation
├── .gitignore              # Ignored files list
├── templates/
│   └── index.html          # Frontend page structure
└── static/
    ├── css/
    │   └── style.css       # Premium custom styling
    └── js/
        └── app.js          # Main application logic & state
```
