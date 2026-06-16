from flask import Flask, jsonify, render_template
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse Atom Feed XML
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(response.content)
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            date_str = title.text if title is not None else 'Unknown Date'
            
            link_el = entry.find('atom:link', ns)
            link = link_el.attrib.get('href') if link_el is not None else ''
            
            content_el = entry.find('atom:content', ns)
            content_html = content_el.text if content_el is not None else ''
            
            # Parse HTML content inside Atom feed
            soup = BeautifulSoup(content_html, 'html.parser')
            updates = []
            
            current_type = "Update"
            current_paragraphs = []
            
            for child in soup.children:
                if child.name == 'h3':
                    # Save previous update if exists
                    if current_paragraphs:
                        updates.append({
                            'type': current_type,
                            'description': ''.join(str(c) for c in current_paragraphs).strip()
                        })
                    current_type = child.get_text().strip()
                    current_paragraphs = []
                elif child.name is not None:
                    current_paragraphs.append(child)
            
            # Save the last update
            if current_paragraphs or current_type != "Update":
                updates.append({
                    'type': current_type,
                    'description': ''.join(str(c) for c in current_paragraphs).strip()
                })
                
            entries.append({
                'date': date_str,
                'link': link,
                'updates': updates
            })
            
        return entries, None
    except Exception as e:
        return None, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    releases, error = parse_release_notes()
    if error:
        return jsonify({'error': error}), 500
    return jsonify(releases)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
