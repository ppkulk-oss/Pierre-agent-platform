from flask import Flask, render_template, request, redirect, url_for
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
DATABASE = 'wine_database.db'

def init_db():
    if not os.path.exists(DATABASE):
        conn = sqlite3.connect(DATABASE)
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

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    init_db()
    conn = get_db()
    wines = conn.execute('SELECT * FROM wines ORDER BY date_tasted DESC').fetchall()
    conn.close()
    return render_template('wine_dashboard.html', wines=wines)

@app.route('/add', methods=['POST'])
def add_wine():
    conn = get_db()
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
    return redirect(url_for('index'))

@app.route('/wine/<int:wine_id>')
def wine_detail(wine_id):
    conn = get_db()
    wine = conn.execute('SELECT * FROM wines WHERE id = ?', (wine_id,)).fetchone()
    conn.close()
    if wine is None:
        return "Wine not found", 404
    return render_template('wine_detail.html', wine=wine)

@app.route('/delete/<int:wine_id>', methods=['POST'])
def delete_wine(wine_id):
    conn = get_db()
    conn.execute('DELETE FROM wines WHERE id = ?', (wine_id,))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
