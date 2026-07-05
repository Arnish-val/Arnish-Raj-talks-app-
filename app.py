import os
import json
import feedparser
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'releases_cache.json')
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_feed_content(html_content):
    """
    Parses the HTML content of a release note entry and splits it into
    individual update items based on heading tags (h3, h4).
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    updates = []
    
    current_type = "General"
    current_html = []
    
    for child in soup.contents:
        if child.name in ['h3', 'h4']:
            if current_html:
                html_str = "".join(str(c) for c in current_html).strip()
                if html_str:
                    updates.append({
                        'type': current_type,
                        'html': html_str,
                        'text': BeautifulSoup(html_str, 'html.parser').get_text().strip()
                    })
                current_html = []
            current_type = child.get_text().strip()
        else:
            current_html.append(child)
            
    if current_html:
        html_str = "".join(str(c) for c in current_html).strip()
        if html_str:
            updates.append({
                'type': current_type,
                'html': html_str,
                'text': BeautifulSoup(html_str, 'html.parser').get_text().strip()
            })
            
    # If no updates were parsed (empty or no headers/paragraphs), put the raw content
    if not updates:
        text_content = soup.get_text().strip()
        if text_content:
            updates.append({
                'type': 'General',
                'html': html_content,
                'text': text_content
            })
            
    return updates

def fetch_and_cache_releases():
    """
    Fetches the BigQuery release notes XML feed, parses it, and caches the results locally.
    """
    try:
        feed = feedparser.parse(FEED_URL)
        
        # Check if parsing was successful and we got entries
        if not feed.entries and feed.bozo:
            # If there was a parsing error, raise it
            raise Exception(f"Feed parsing error: {feed.bozo_exception}")
            
        releases = []
        for entry in feed.entries:
            # Extract content
            html_content = ""
            if 'content' in entry:
                html_content = entry.content[0].value
            elif 'summary' in entry:
                html_content = entry.summary
                
            updates = parse_feed_content(html_content)
            
            releases.append({
                'id': entry.get('id', entry.get('link', '')),
                'title': entry.get('title', 'Unknown Date'),
                'date': entry.get('updated', entry.get('published', '')),
                'link': entry.get('link', ''),
                'updates': updates
            })
            
        # Cache to file
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(releases, f, indent=2, ensure_ascii=False)
            
        return releases, None
    except Exception as e:
        return None, str(e)

def get_cached_releases():
    """
    Reads the cached release notes if they exist, otherwise fetches them.
    """
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f), None
        except Exception as e:
            return fetch_and_cache_releases()
    else:
        return fetch_and_cache_releases()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def api_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if force_refresh:
        releases, error = fetch_and_cache_releases()
    else:
        releases, error = get_cached_releases()
        
    if error:
        return jsonify({'success': False, 'error': error}), 500
        
    return jsonify({'success': True, 'releases': releases})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
