from flask import Flask, render_template, request, redirect, url_for, jsonify
import sqlite3
from datetime import date, datetime
import os
import glob
import json
import markdown as md

app = Flask(__name__)

# ============================================================
# JAPAN DASHBOARD DATA
# ============================================================
TRAVELERS = [
    {"name": "Prashant", "initial": "P", "note": "", "color": "#ff6b9d"},
    {"name": "Tejal", "initial": "T", "note": "seafood and chicken, no beef", "color": "#0d7377"},
    {"name": "Riya", "initial": "R", "note": "vegetarian, eats chicken", "color": "#9b59b6"},
    {"name": "Lara", "initial": "L", "note": "picky eater, likes bland foods", "color": "#ffd700"},
]

DESTINATIONS = [
    {"city": "Tokyo", "jp": "東京", "prefecture": "Kanto", "nights": 3, "dates": "Apr 1-4",
     "hotel": "Royal Park Hotel Iconic Tokyo Shiodome", "conf": "6210444904",
     "highlights": ["Junior Suite Twin + 2 Extra beds", "PIN: 5140"]},
    {"city": "Hakone", "jp": "箱根", "prefecture": "Kanagawa", "nights": 1, "dates": "Apr 4-5",
     "hotel": "Hakone Kowakien Mikawaya Ryokan", "conf": "Expedia #72068424131155",
     "highlights": ["Kaiseki dinner and onsen access included"]},
    {"city": "Kyoto", "jp": "京都", "prefecture": "Kansai", "nights": 2, "dates": "Apr 5-7",
     "hotel": "Cross Hotel Kyoto", "conf": "Expedia #72068669603342",
     "highlights": ["Deluxe Family Twin Room", "Apr 5-7"]},
    {"city": "Kyoto (MIMARU)", "jp": "京都", "prefecture": "Kansai", "nights": 1, "dates": "Apr 7",
     "hotel": "MIMARU Kyoto Nishinotoin Takatsuji", "conf": "Expedia #72071476254758",
     "highlights": ["Apr 7-8", "Family apartment-style room"]},
    {"city": "Osaka", "jp": "大阪", "prefecture": "Kansai", "nights": 1, "dates": "Apr 8",
     "hotel": "Hotel Hankyu RESPIRE OSAKA", "conf": "Expedia #72068670183986",
     "highlights": ["Apr 8-9", "Connecting Room for 5 people"]},
    {"city": "Narita", "jp": "成田", "prefecture": "Chiba", "nights": 1, "dates": "Apr 9-10",
     "hotel": "Hotel Nikko Narita", "conf": "Expedia #72068692164929",
     "highlights": ["Japanese Style Family Room", "Free Breakfast"]},
]

RESTAURANTS = [
    {"name": "Sushi Zanmai", "city": "Tokyo", "type": "Conveyor Sushi", "tags": ["Fun", "English Menu"], "diet": "all"},
    {"name": "CoCo Ichibanya", "city": "Tokyo", "type": "Japanese Curry", "tags": ["Customizable"], "diet": "all"},
    {"name": "Daikokuya Tempura", "city": "Tokyo", "type": "Tempura", "tags": ["Historic", "Near Senso-ji"], "diet": "vegetarian"},
    {"name": "Ichiran Ramen", "city": "Tokyo", "type": "Ramen", "tags": ["Private Booths"], "diet": "all"},
    {"name": "Hatsuhana Soba", "city": "Hakone", "type": "Soba", "tags": ["100+ Years Old"], "diet": "vegetarian"},
    {"name": "Nishiki Market", "city": "Kyoto", "type": "Food Market", "tags": ["Variety"], "diet": "all"},
    {"name": "Shoraian", "city": "Kyoto", "type": "Tofu Cuisine", "tags": ["Bamboo Forest"], "diet": "vegetarian"},
    {"name": "Kani Dōraku", "city": "Osaka", "type": "Crab", "tags": ["Famous Sign"], "diet": "nobeef"},
    {"name": "Takoyaki Juhachiban", "city": "Osaka", "type": "Takoyaki", "tags": ["Osaka Specialty"], "diet": "all"},
    {"name": "Mario Café", "city": "Osaka", "type": "Themed Cafe", "tags": ["USJ"], "diet": "all"},
]

# ============================================================
# WINE DATABASE SETUP
# ============================================================
WINE_DB = 'wine_database.db'

def init_wine_db():
    if not os.path.exists(WINE_DB):
        conn = sqlite3.connect(WINE_DB)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE wines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producer TEXT NOT NULL,
                wine_name TEXT NOT NULL,
                vintage INTEGER,
                region TEXT,
                country TEXT,
                grape_variety TEXT,
                date_tasted DATE,
                rating INTEGER CHECK(rating >= 0 AND rating <= 100),
                tasting_notes TEXT,
                price_paid REAL,
                source TEXT,
                quantity INTEGER DEFAULT 1,
                drink_by DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

def get_wine_db():
    conn = sqlite3.connect(WINE_DB)
    conn.row_factory = sqlite3.Row
    return conn

# ============================================================
# PORTAL / ROOT
# ============================================================
@app.route('/')
def portal():
    brief = get_latest_brief_html()
    return render_template('portal.html', brief=brief)

# ============================================================
# JAPAN ROUTES
# ============================================================
@app.route('/japan')
def japan():
    departure = date(2026, 4, 1)
    days_left = (departure - date.today()).days
    return render_template('index.html', days_left=days_left, travelers=TRAVELERS, 
                          destinations=DESTINATIONS, restaurants=RESTAURANTS)

# ============================================================
# WINE ROUTES
# ============================================================
@app.route('/wine')
def wine_dashboard():
    init_wine_db()
    conn = get_wine_db()
    wines = conn.execute('SELECT * FROM wines ORDER BY created_at DESC').fetchall()
    conn.close()
    
    # Build label URLs for wines without images
    wine_list = []
    for wine in wines:
        wine_dict = dict(wine)
        if not wine_dict.get('label_image'):
            # Use wine-searcher label lookup as fallback
            search_query = f"{wine_dict['producer']} {wine_dict['wine_name']}".replace(' ', '-').lower()
            wine_dict['label_image'] = f"https://images.vivino.com/thumbs/default_label.jpg"
        wine_list.append(wine_dict)
    
    return render_template('wine_dashboard.html', wines=wine_list)

@app.route('/wine/add', methods=['POST'])
def add_wine():
    conn = get_wine_db()
    conn.execute('''
        INSERT INTO wines (producer, wine_name, vintage, region, country, grape_variety,
                          date_tasted, rating, tasting_notes, price_paid, source, quantity, drink_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        request.form['producer'],
        request.form['wine_name'],
        request.form.get('vintage') or None,
        request.form.get('region'),
        request.form.get('country'),
        request.form.get('grape_variety'),
        request.form.get('date_tasted') or datetime.now().strftime('%Y-%m-%d'),
        request.form.get('rating') or None,
        request.form.get('tasting_notes'),
        request.form.get('price_paid') or None,
        request.form.get('source'),
        request.form.get('quantity') or 1,
        request.form.get('drink_by') or None
    ))
    conn.commit()
    conn.close()
    return redirect(url_for('wine_dashboard'))

@app.route('/wine/<int:wine_id>')
def wine_detail(wine_id):
    conn = get_wine_db()
    wine = conn.execute('SELECT * FROM wines WHERE id = ?', (wine_id,)).fetchone()
    conn.close()
    if wine is None:
        return "Wine not found", 404
    return render_template('wine_detail.html', wine=wine)

@app.route('/wine/delete/<int:wine_id>', methods=['POST'])
def delete_wine(wine_id):
    conn = get_wine_db()
    conn.execute('DELETE FROM wines WHERE id = ?', (wine_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('wine_dashboard'))

# ============================================================
# MEDIA ROUTE
# ============================================================
@app.route('/media')
def media_dashboard():
    return render_template('media.html')

# ============================================================
# RESTAURANTS ROUTE
# ============================================================
@app.route('/restaurants')
def restaurants():
    return render_template('restaurants.html')

# ============================================================
# FINANCE ROUTE
# ============================================================
@app.route('/finance')
def finance_dashboard():
    return render_template('finance.html')

# ============================================================
# BRIEF API - Serve latest daily brief content
# ============================================================
def get_latest_brief():
    """Find and return the latest daily brief from memory files."""
    try:
        # Get the directory where this script is located
        app_dir = os.path.dirname(os.path.abspath(__file__))
        # Look for brief files in memory directory (relative to app root)
        brief_files = glob.glob(os.path.join(app_dir, 'memory/*Brief*.md'))
        brief_files += glob.glob(os.path.join(app_dir, 'Prashant_*_Daily_Brief*.md'))
        
        if not brief_files:
            return None
        
        # Sort by modification time (newest first)
        latest_file = max(brief_files, key=os.path.getmtime)
        
        with open(latest_file, 'r') as f:
            content = f.read()
        
        return {
            'filename': os.path.basename(latest_file),
            'content': content,
            'date': datetime.fromtimestamp(os.path.getmtime(latest_file)).isoformat()
        }
    except Exception as e:
        print(f"Error loading brief: {e}")
        return None

def get_latest_brief_html():
    """Find and return the latest daily brief as HTML."""
    try:
        # Get the directory where this script is located
        app_dir = os.path.dirname(os.path.abspath(__file__))
        # Look for brief files in memory directory (relative to app root)
        brief_files = glob.glob(os.path.join(app_dir, 'memory/*Brief*.md'))
        brief_files += glob.glob(os.path.join(app_dir, 'Prashant_*_Daily_Brief*.md'))
        
        if not brief_files:
            return None
        
        # Sort by modification time (newest first)
        latest_file = max(brief_files, key=os.path.getmtime)
        
        with open(latest_file, 'r') as f:
            content = f.read()
        
        # Convert markdown to HTML
        html_content = md.markdown(content, extensions=['tables', 'fenced_code'])
        
        return {
            'filename': os.path.basename(latest_file),
            'content': html_content,
            'date': datetime.fromtimestamp(os.path.getmtime(latest_file)).isoformat()
        }
    except Exception as e:
        print(f"Error loading brief: {e}")
        return None

@app.route('/api/brief')
def api_brief():
    """API endpoint to get the latest daily brief."""
    brief = get_latest_brief()
    if brief:
        return jsonify(brief)
    return jsonify({'error': 'No brief found'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
