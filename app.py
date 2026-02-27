from flask import Flask, render_template, request, redirect, url_for
import sqlite3
from datetime import date, datetime
import os

app = Flask(__name__)

# ============================================================
# JAPAN DASHBOARD DATA
# ============================================================
TRAVELERS = [
    {"name": "Prashant", "initial": "P", "note": "", "color": "#ff6b9d"},
    {"name": "Tejal", "initial": "T", "note": "no beef", "color": "#0d7377"},
    {"name": "Riya", "initial": "R", "note": "vegetarian", "color": "#9b59b6"},
    {"name": "Lara", "initial": "L", "note": "picky", "color": "#ffd700"},
]

DESTINATIONS = [
    {"city": "Tokyo", "jp": "東京", "prefecture": "Kanto", "nights": 3, "dates": "Apr 1-4",
     "hotel": "Royal Park Hotel Iconic Shiodome", "conf": "6210444904",
     "highlights": ["Senso-ji Temple", "Shibuya Crossing", "Tokyo Skytree", "Harajuku"]},
    {"city": "Hakone", "jp": "箱根", "prefecture": "Kanagawa", "nights": 1, "dates": "Apr 4-5",
     "hotel": "Mikawaya Ryokan", "conf": "Exp: 72068424131155",
     "highlights": ["Hot Springs", "Hakone Loop", "Mt. Fuji Views", "Kaiseki Dinner"]},
    {"city": "Kyoto", "jp": "京都", "prefecture": "Kansai", "nights": 2, "dates": "Apr 5-7",
     "hotel": "Cross Hotel Kyoto", "conf": "Exp: 72068669603342",
     "highlights": ["Fushimi Inari", "Kiyomizu-dera", "Gion District", "Bamboo Grove"]},
    {"city": "Osaka", "jp": "大阪", "prefecture": "Kansai", "nights": 2, "dates": "Apr 7-9",
     "hotel": "Hotel Hankyu RESPIRE", "conf": "Exp: 72068670183986",
     "highlights": ["Dotonbori", "Universal Studios", "Osaka Castle", "Street Food"]},
    {"city": "Narita", "jp": "成田", "prefecture": "Chiba", "nights": 1, "dates": "Apr 9-10",
     "hotel": "Hotel Nikko Narita", "conf": "Exp: 72068692164929",
     "highlights": ["Narita-san Temple", "Last Minute Shopping", "Airport Shuttle"]},
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
# JAPAN ROUTES
# ============================================================
@app.route('/')
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
    wines = conn.execute('SELECT * FROM wines ORDER BY date_tasted DESC').fetchall()
    conn.close()
    return render_template('wine_dashboard.html', wines=wines)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
