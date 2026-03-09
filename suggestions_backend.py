#!/usr/bin/env python3
"""
Firefox History Suggestions Backend

Reads Firefox/Zen Browser history from places.sqlite and suggests
new bookmarks based on user's browsing habits using LLM (llama.cpp).
"""

import os
import sys
import json
import sqlite3
import tempfile
import shutil
import glob
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import logging
import requests

# ── Configuration ────────────────────────────────────────────────────────────
LLM_ENDPOINT = os.environ.get('LLM_ENDPOINT', 'http://localhost:11435/v1/chat/completions')

# Read model from /etc/llama/models.ini if available
DEFAULT_MODEL = 'Qwen3.5-35B-A3B-UD-Q4_K_XL'  # Default model (MoE, 35B)
models_ini_path = '/etc/llama/models.ini'
if os.path.exists(models_ini_path):
    try:
        import configparser
        config = configparser.ConfigParser()
        # Handle config file with pre-section content by reading line by line
        # and prepending a section header if needed
        with open(models_ini_path, 'r') as f:
            lines = f.readlines()
        
        # Check if file starts with a section header
        has_section_header = False
        for line in lines:
            line = line.strip()
            if line and not line.startswith(';') and not line.startswith('#'):
                if line.startswith('['):
                    has_section_header = True
                break
        
        if not has_section_header:
            # Prepend a DEFAULT section header
            lines = ['[DEFAULT]\n'] + lines
        
        import io
        config.read_file(io.StringIO(''.join(lines)))
        if 'DEFAULT' in config and 'model' in config['DEFAULT']:
            pass  # Use default from global
        # Try to find first Qwen model
        for section in config.sections():
            if section.startswith('Qwen'):
                DEFAULT_MODEL = section
                break
    except Exception as e:
        print(f"Could not read models.ini: {e}")
        
LLM_MODEL = os.environ.get('LLM_MODEL', DEFAULT_MODEL)
CACHE_FILE = os.path.join(tempfile.gettempdir(), 'suggestions_cache.json')

# Check if model uses reasoning format
def uses_reasoning_format():
    """Check if the model uses reasoning content instead of regular content."""
    try:
        import requests
        response = requests.get(LLM_ENDPOINT.replace('/chat/completions', '/models'), timeout=5)
        if response.status_code == 200:
            data = response.json()
            for model in data.get('data', []):
                if model.get('id') == LLM_MODEL:
                    args = model.get('status', {}).get('args', [])
                    for arg in args:
                        if 'reasoning-format' in arg:
                            return True
    except:
        pass
    return False
MAX_SUGGESTIONS = 10

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/suggestions_backend.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ── Firefox History Reader ───────────────────────────────────────────────────

def find_firefox_profile():
    """
    Find Firefox/Zen Browser profile directory.
    Returns path to places.sqlite or None if not found.
    """
    # Try environment variable first (for Docker)
    home = os.environ.get('HOME', os.path.expanduser('~'))
    
    # Search patterns
    search_patterns = [
        # Zen Browser
        os.path.join(home, '.zen', '*', 'places.sqlite'),
        # Firefox
        os.path.join(home, '.mozilla', 'firefox', '*', 'places.sqlite'),
    ]
    
    for pattern in search_patterns:
        matches = glob.glob(pattern)
        if matches:
            logger.info(f"Found Firefox profile: {matches[0]}")
            return matches[0]
    
    return None


def get_firefox_history():
    """
    Read Firefox history from places.sqlite.
    Returns list of (url, title, visit_count, last_visit_date) tuples.
    """
    profile_path = find_firefox_profile()
    if not profile_path:
        logger.error("Firefox profile not found")
        return []
    
    # Create a temporary copy to avoid locking issues
    temp_db = tempfile.mktemp(suffix='.sqlite')
    
    try:
        # Copy the database
        shutil.copy2(profile_path, temp_db)
        
        # Connect and query
        conn = sqlite3.connect(temp_db)
        cursor = conn.cursor()
        
        query = """
        SELECT url, title, visit_count, last_visit_date
        FROM moz_places
        WHERE visit_count > 0 
          AND url NOT LIKE 'about:%' 
          AND url NOT LIKE 'moz-%'
          AND url NOT LIKE 'chrome:%'
          AND url NOT LIKE 'data:%'
          AND url NOT LIKE 'blob:%'
        ORDER BY visit_count DESC
        LIMIT 200
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        conn.close()
        logger.info(f"Read {len(results)} history entries from Firefox")
        
        return results
        
    except Exception as e:
        logger.error(f"Error reading history: {e}")
        return []
    finally:
        # Clean up temp file
        try:
            os.unlink(temp_db)
        except:
            pass


def extract_domains(history_entries):
    """
    Extract unique domains from history entries.
    Returns dict of domain -> {url, title, visit_count, last_visit_date}
    """
    domains = {}
    
    for url, title, visit_count, last_visit_date in history_entries:
        try:
            # Extract domain from URL
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Skip common domains we don't want
            skip_domains = ['localhost', '127.0.0.1', '0.0.0.0', 'github.com', 'youtube.com']
            if any(skip in domain for skip in skip_domains):
                continue
            
            if domain not in domains:
                domains[domain] = {
                    'url': url,
                    'title': title or '',
                    'visit_count': visit_count,
                    'last_visit_date': last_visit_date,
                    'count': 0,
                    'urls': []
                }
            
            domains[domain]['count'] += visit_count
            domains[domain]['urls'].append(url)
            
        except Exception as e:
            logger.debug(f"Error parsing URL {url}: {e}")
            continue
    
    # Sort by visit count and get top domains
    sorted_domains = sorted(
        domains.items(),
        key=lambda x: x[1]['count'],
        reverse=True
    )[:30]
    
    return sorted_domains


# ── LLM Integration ──────────────────────────────────────────────────────────

def call_llm(domains):
    """
    Call LLM endpoint to get suggestions based on browsing history.
    Returns list of suggestion dictionaries.
    """
    system_prompt = """Sen bir kişiselleştirilmiş web içeriği küratörümsün.
Kullanıcının tarama alışkanlıklarına bakarak onun henüz keşfetmediği
ama ilgi duyacağı 10 web sitesi veya kaynak öner.
Her öneri için JSON formatında yanıt ver.

Cevap formatı:
{
  "suggestions": [
    {
      "title": "Site adı",
      "url": "https://...",
      "description": "Neden önerildi (1 cümle)",
      "category": "Kategori (örn: Geliştirici Araçları, Araştırma, Verimlilik)",
      "confidence": 0.0-1.0
    }
  ]
}"""

    # Format domains as user message
    domain_list = "\n".join([
        f"- {domain}: {info['count']} ziyaret" 
        for domain, info in domains
    ])
    
    user_prompt = f"""Kullanıcının ziyaret ettiği en popüler web siteleri:
{domain_list}

Zaman içi bir şekilde keşfedilmemiş, kullanıcıya önerilebilecek 10 web sitesi öner.

Yanıtını sadece JSON formatında ver. Başka hiçbir metin ekleme."""

    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 1000,
        "stream": False
    }

    try:
        response = requests.post(
            LLM_ENDPOINT,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        
        data = response.json()
        
        # Try multiple possible response formats
        content = data.get('message', {}).get('content', '')
        if not content:
            content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        if not content:
            content = data.get('choices', [{}])[0].get('message', {}).get('reasoning_content', '')
        if not content:
            content = data.get('content', '')
        
        # Try to extract JSON from response
        json_start = content.find('{')
        json_end = content.rfind('}') + 1
        
        if json_start != -1 and json_end > json_start:
            content = content[json_start:json_end]
        
        result = json.loads(content)
        return result.get('suggestions', [])
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        logger.error(f"Response content: {content[:500] if content else 'Empty'}")
        return []
    except requests.exceptions.RequestException as e:
        logger.error(f"LLM API call failed: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error calling LLM: {e}")
        return []


def get_suggestions(force_refresh=False):
    """
    Get suggestions, using cache unless force_refresh is True.
    """
    if not force_refresh:
        try:
            if os.path.exists(CACHE_FILE):
                with open(CACHE_FILE, 'r') as f:
                    cache_data = json.load(f)
                if time.time() - cache_data.get('timestamp', 0) < 3600:  # 1 hour cache
                    logger.info("Returning cached suggestions")
                    return cache_data.get('suggestions', [])
        except Exception as e:
            logger.warning(f"Cache read failed: {e}")
    
    # Get history and extract domains
    history = get_firefox_history()
    if not history:
        return []
    
    domains = extract_domains(history)
    if not domains:
        return []
    
    # Call LLM
    suggestions = call_llm(domains)
    
    if not suggestions:
        logger.warning("No suggestions from LLM")
        return []
    
    # Cache the result
    try:
        cache_data = {
            'suggestions': suggestions[:MAX_SUGGESTIONS],
            'timestamp': time.time()
        }
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache_data, f)
    except Exception as e:
        logger.warning(f"Cache write failed: {e}")
    
    return suggestions[:MAX_SUGGESTIONS]


# ── HTTP Server ──────────────────────────────────────────────────────────────

class SuggestionsHandler(BaseHTTPRequestHandler):
    """HTTP request handler for suggestions API."""
    
    def log_message(self, format, *args):
        logger.info("%s - %s" % (self.address_string(), format % args))
    
    def set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        
        if path == '/suggestions':
            self.handle_suggestions(query)
        elif path == '/status':
            self.handle_status()
        else:
            self.send_error(404, 'Not found')
    
    def handle_suggestions(self, query):
        force_refresh = query.get('refresh', ['false'])[0].lower() == 'true'
        
        try:
            suggestions = get_suggestions(force_refresh)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.set_cors_headers()
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': True,
                'count': len(suggestions),
                'suggestions': suggestions
            }).encode())
            
        except Exception as e:
            logger.error(f"Error getting suggestions: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())
    
    def handle_status(self):
        status = {
            'running': True,
            'llm_endpoint': LLM_ENDPOINT,
            'cache_file': CACHE_FILE,
            'cache_exists': os.path.exists(CACHE_FILE)
        }
        
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r') as f:
                    cache_data = json.load(f)
                status['cache_age'] = time.time() - cache_data.get('timestamp', 0)
            except:
                pass
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())


def run_server(port=7421):
    """Run the HTTP server."""
    server = HTTPServer(('0.0.0.0', port), SuggestionsHandler)
    logger.info(f"Suggestions backend server starting on port {port}")
    
    # Clear previous cache
    try:
        if os.path.exists(CACHE_FILE):
            os.unlink(CACHE_FILE)
        logger.info("Cleared previous cache")
    except:
        pass
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server shutting down")
        server.shutdown()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Firefox History Suggestions Backend')
    parser.add_argument('--port', '-p', type=int, default=7421,
                        help='Port to run the server on (default: 7421)')
    parser.add_argument('--llm-endpoint', type=str, default=None,
                        help='LLM API endpoint (default: from LLM_ENDPOINT env)')
    parser.add_argument('--llm-model', type=str, default=None,
                        help='LLM model name (default: from LLM_MODEL env)')
    
    args = parser.parse_args()
    
    if args.llm_endpoint:
        os.environ['LLM_ENDPOINT'] = args.llm_endpoint
    if args.llm_model:
        os.environ['LLM_MODEL'] = args.llm_model
    
    run_server(args.port)