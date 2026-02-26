#!/usr/bin/env python3
"""
🇯🇵 Japan Family Trip Dashboard - POLISHED EDITION
For: Prashant, Tejal, Riya & Lara | April 1-10, 2026

A modern, professional dashboard with dark/light theme, animations,
card-based layouts, and mobile-optimized design.

Run: streamlit run scripts/japan-dashboard-polished.py
"""

import streamlit as st
import plotly.graph_objects as go
from datetime import date

# ═══════════════════════════════════════════════════════════════════════════════
# PAGE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════
st.set_page_config(
    page_title="Japan Trip 2026 | Family Adventure",
    page_icon="🌸",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ═══════════════════════════════════════════════════════════════════════════════
# THEME MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════
if "theme" not in st.session_state:
    st.session_state.theme = "dark"

def toggle_theme():
    st.session_state.theme = "light" if st.session_state.theme == "dark" else "dark"

def get_colors():
    if st.session_state.theme == "dark":
        return {
            "bg": "#0f172a", "card": "#1e293b", "text": "#f8fafc",
            "muted": "#94a3b8", "border": "#334155",
            "pink": "#f472b6", "coral": "#fb7185", "purple": "#a78bfa",
            "blue": "#60a5fa", "green": "#34d399", "yellow": "#fbbf24"
        }
    else:
        return {
            "bg": "#f8fafc", "card": "#ffffff", "text": "#0f172a",
            "muted": "#64748b", "border": "#e2e8f0",
            "pink": "#db2777", "coral": "#e11d48", "purple": "#7c3aed",
            "blue": "#2563eb", "green": "#059669", "yellow": "#d97706"
        }

colors = get_colors()

# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOM CSS
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.stApp {{ background: {colors['bg']}; font-family: 'Inter', sans-serif; }}
#MainMenu, header, footer, .stDeployButton {{ display: none; }}

/* Hero */
.hero {{
    background: linear-gradient(135deg, {colors['pink']}20 0%, {colors['purple']}15 50%, {colors['bg']} 100%);
    border-radius: 24px;
    padding: 50px 40px;
    margin: 20px 0 30px 0;
    text-align: center;
    border: 1px solid {colors['border']};
}}
.hero-badge {{
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(90deg, {colors['pink']}, {colors['coral']});
    color: white; padding: 8px 20px; border-radius: 50px;
    font-size: 0.875rem; font-weight: 600; margin-bottom: 20px;
}}
.hero h1 {{
    font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800;
    color: {colors['text']}; margin: 0 0 12px 0;
    background: linear-gradient(90deg, {colors['pink']}, {colors['purple']});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}}
.hero p {{ color: {colors['muted']}; font-size: 1.2rem; margin: 0 0 24px 0; }}

/* Family Pills */
.family-pills {{
    display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;
}}
.pill {{
    background: {colors['card']}; border: 1px solid {colors['border']};
    padding: 10px 18px; border-radius: 50px; color: {colors['text']};
    font-size: 0.9rem; transition: all 0.3s ease;
}}
.pill:hover {{ transform: translateY(-2px); border-color: {colors['pink']}; box-shadow: 0 8px 20px rgba(0,0,0,0.1); }}

/* Countdown */
.countdown {{
    display: flex; justify-content: center; gap: 20px; margin: 30px 0;
}}
.count-box {{
    background: {colors['card']}; border: 1px solid {colors['border']};
    border-radius: 16px; padding: 20px 30px; text-align: center;
    min-width: 90px; position: relative; overflow: hidden;
}}
.count-box::before {{
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, {colors['pink']}, {colors['coral']});
}}
.count-number {{
    font-size: 2.5rem; font-weight: 800;
    background: linear-gradient(90deg, {colors['pink']}, {colors['coral']});
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}}
.count-label {{ font-size: 0.75rem; color: {colors['muted']}; text-transform: uppercase; letter-spacing: 1px; }}

/* Cards */
.card {{
    background: {colors['card']}; border: 1px solid {colors['border']};
    border-radius: 20px; padding: 24px; margin-bottom: 16px;
    transition: all 0.3s ease;
}}
.card:hover {{ transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }}
.card-header {{
    display: flex; align-items: center; gap: 16px; margin-bottom: 16px;
}}
.card-icon {{
    width: 56px; height: 56px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.75rem; background: {colors['pink']}20;
}}
.card-title {{ font-size: 1.25rem; font-weight: 700; color: {colors['text']}; margin: 0; }}
.card-subtitle {{ font-size: 0.875rem; color: {colors['muted']}; }}

/* Hotel Cards */
.hotel-card {{
    background: {colors['card']}; border: 1px solid {colors['border']};
    border-radius: 20px; overflow: hidden; margin-bottom: 16px;
    transition: all 0.3s ease;
}}
.hotel-card:hover {{ transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }}
.hotel-header {{
    background: linear-gradient(90deg, {colors['pink']}, {colors['coral']});
    padding: 20px 24px; color: white;
}}
.hotel-header h4 {{ margin: 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }}
.hotel-header h3 {{ margin: 4px 0 0 0; font-size: 1.3rem; }}
.hotel-body {{ padding: 20px 24px; }}

/* Restaurant Cards */
.rest-grid {{
    display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;
}}
.rest-card {{
    background: {colors['card']}; border: 1px solid {colors['border']};
    border-radius: 16px; padding: 20px; transition: all 0.3s ease;
}}
.rest-card:hover {{ transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.1); }}
.rest-name {{ font-size: 1.1rem; font-weight: 700; color: {colors['text']}; margin: 0 0 4px 0; }}
.rest-city {{ font-size: 0.75rem; color: {colors['muted']}; text-transform: uppercase; }}
.rest-type {{
    display: inline-block; background: {colors['bg']}; padding: 4px 12px;
    border-radius: 20px; font-size: 0.75rem; color: {colors['muted']}; margin: 8px 0;
}}
.diet-tag {{
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; margin-right: 6px;
}}
.diet-veg {{ background: {colors['green']}20; color: {colors['green']}; }}
.diet-picky {{ background: {colors['yellow']}20; color: {colors['yellow']}; }}
.diet-nobeef {{ background: {colors['coral']}20; color: {colors['coral']}; }}

/* Tabs */
.stTabs [data-baseweb="tab-list"] {{
    gap: 8px; background: {colors['card']}; padding: 8px;
    border-radius: 16px; border: 1px solid {colors['border']};
}}
.stTabs [data-baseweb="tab"] {{
    height: 44px; padding: 0 20px; border-radius: 12px;
    color: {colors['muted']}; font-weight: 500; border: none !important;
}}
.stTabs [aria-selected="true"] {{
    background: linear-gradient(90deg, {colors['pink']}, {colors['coral']}) !important;
    color: white !important;
}}

/* Theme Toggle */
.theme-toggle {{
    position: fixed; top: 20px; right: 20px; z-index: 1000;
}}
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# DATA
# ═══════════════════════════════════════════════════════════════════════════════
DEPARTURE = date(2026, 4, 1)

HOTELS = [
    {"city": "Tokyo", "name": "Royal Park Hotel Iconic Shiodome", "dates": "Apr 1-4", "nights": 3, "conf": "6210444904"},
    {"city": "Hakone", "name": "Mikawaya Ryokan", "dates": "Apr 4-5", "nights": 1, "conf": "Exp: 72068424131155"},
    {"city": "Kyoto", "name": "Cross Hotel Kyoto", "dates": "Apr 5-7", "nights": 2, "conf": "Exp: 72068669603342"},
    {"city": "Osaka", "name": "Hotel Hankyu RESPIRE", "dates": "Apr 7-9", "nights": 2, "conf": "Exp: 72068670183986"},
    {"city": "Narita", "name": "Hotel Nikko Narita", "dates": "Apr 9-10", "nights": 1, "conf": "Exp: 72068692164929"},
]

ITINERARY = [
    {"day": 1, "title": "✈️ Arrival & Tokyo", "city": "Tokyo", "date": "Wed, Apr 1",
     "activities": ["2:30 PM - Land at NRT", "4:00 PM - Narita Express", "5:30 PM - Check-in", "Evening - Explore Shiodome"]},
    {"day": 2, "title": "⛩️ Classic Tokyo", "city": "Tokyo", "date": "Thu, Apr 2",
     "activities": ["9:00 AM - Senso-ji Temple", "11:30 AM - Nakamise Street", "2:30 PM - Tokyo Skytree", "Evening - Ginza dinner"]},
    {"day": 3, "title": "🌟 Pop Culture", "city": "Tokyo", "date": "Fri, Apr 3",
     "activities": ["10:00 AM - Meiji Shrine", "12:00 PM - Harajuku", "3:00 PM - Shibuya Crossing", "3:30 PM - Shibuya Sky"]},
    {"day": 4, "title": "🏔️ Tokyo → Hakone", "city": "Hakone", "date": "Sat, Apr 4",
     "activities": ["10:00 AM - Romancecar", "12:30 PM - Ryokan check-in", "2:30 PM - Hakone Loop", "6:30 PM - Kaiseki dinner"]},
    {"day": 5, "title": "🚅 Hakone → Kyoto", "city": "Kyoto", "date": "Sun, Apr 5",
     "activities": ["7:00 AM - Ryokan breakfast", "2:03 PM - Shinkansen", "5:30 PM - Check-in", "Evening - Gion stroll"]},
    {"day": 6, "title": "🎋 Kyoto Temples", "city": "Kyoto", "date": "Mon, Apr 6",
     "activities": ["9:00 AM - Fushimi Inari", "2:00 PM - Kiyomizu-dera", "4:00 PM - Sannenzaka", "Evening - Gion dinner"]},
    {"day": 7, "title": "🌿 Arashiyama → Osaka", "city": "Osaka", "date": "Tue, Apr 7",
     "activities": ["9:30 AM - Bamboo Grove", "10:30 AM - Tenryu-ji", "3:00 PM - Train to Osaka", "6:00 PM - Dotonbori"]},
    {"day": 8, "title": "🎢 Universal Studios", "city": "Osaka", "date": "Wed, Apr 8",
     "activities": ["8:30 AM - Depart for USJ", "9:00 AM - Park opens", "Full day - Rides & Nintendo World"]},
    {"day": 9, "title": "🏯 Osaka → Narita", "city": "Narita", "date": "Thu, Apr 9",
     "activities": ["10:00 AM - Osaka Castle", "3:00 PM - Train to Narita", "5:00 PM - Check-in"]},
    {"day": 10, "title": "✈️ Departure", "city": "Narita", "date": "Fri, Apr 10",
     "activities": ["8:00 AM - Breakfast", "9:30 AM - Airport shuttle", "5:15 PM - Flight UA78"]},
]

RESTAURANTS = [
    {"name": "Sushi Zanmai", "city": "Tokyo", "type": "Conveyor Sushi", "diet": ["all"], "note": "Fun for kids, English menu"},
    {"name": "CoCo Ichibanya", "city": "Tokyo", "type": "Japanese Curry", "diet": ["all"], "note": "Customizable spice"},
    {"name": "Daikokuya Tempura", "city": "Tokyo", "type": "Tempura", "diet": ["vegetarian"], "note": "Historic shop near Senso-ji"},
    {"name": "Ichiran Ramen", "city": "Tokyo", "type": "Ramen", "diet": ["all"], "note": "Private booths, customizable"},
    {"name": "Rainbow Pancake", "city": "Tokyo", "type": "Cafe", "diet": ["all", "picky"], "note": "Instagram-famous pancakes"},
    {"name": "Hatsuhana Soba", "city": "Hakone", "type": "Soba", "diet": ["vegetarian"], "note": "100+ year old soba shop"},
    {"name": "Nishiki Market", "city": "Kyoto", "type": "Food Market", "diet": ["all"], "note": "Variety for everyone"},
    {"name": "Shoraian", "city": "Kyoto", "type": "Tofu Cuisine", "diet": ["vegetarian"], "note": "Bamboo forest setting"},
    {"name": "Kani Dōraku", "city": "Osaka", "type": "Crab", "diet": ["nobeef"], "note": "Famous giant crab sign"},
    {"name": "Takoyaki Juhachiban", "city": "Osaka", "type": "Takoyaki", "diet": ["all"], "note": "Osaka specialty"},
    {"name": "Mario Café", "city": "Osaka", "type": "Themed Cafe", "diet": ["all"], "note": "Inside USJ"},
    {"name": "Three Broomsticks", "city": "Osaka", "type": "Western", "diet": ["all", "picky"], "note": "Harry Potter themed"},
]

# ═══════════════════════════════════════════════════════════════════════════════
# HERO SECTION
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<div class="hero">
    <div class="hero-badge">🌸 April 1-10, 2026</div>
    <h1>Japan Family Adventure</h1>
    <p>Prashant, Tejal, Riya & Lara • 10 Days, 5 Cities</p>
    <div class="family-pills">
        <span class="pill">👨‍💼 Prashant</span>
        <span class="pill">👩‍💼 Tejal <small>(no beef)</small></span>
        <span class="pill">👧 Riya <small>(vegetarian)</small></span>
        <span class="pill">👧 Lara <small>(picky eater)</small></span>
    </div>
</div>
""", unsafe_allow_html=True)

# Countdown
days_left = (DEPARTURE - date.today()).days
col1, col2, col3, col4, col5 = st.columns([1, 1, 0.5, 1, 1])
with col2:
    st.markdown(f"""
    <div class="count-box">
        <div class="count-number">{days_left}</div>
        <div class="count-label">Days</div>
    </div>
    """, unsafe_allow_html=True)
with col3:
    st.markdown('<div style="font-size:2rem;text-align:center;color:#f472b6;padding-top:20px">:</div>', unsafe_allow_html=True)
with col4:
    st.markdown("""
    <div class="count-box">
        <div class="count-number">5</div>
        <div class="count-label">Cities</div>
    </div>
    """, unsafe_allow_html=True)

# Theme Toggle
col1, col2 = st.columns([6, 1])
with col2:
    if st.button("🌙 Toggle Theme" if st.session_state.theme == "dark" else "☀️ Toggle Theme"):
        toggle_theme()
        st.rerun()

# ═══════════════════════════════════════════════════════════════════════════════
# TABS
# ═══════════════════════════════════════════════════════════════════════════════
tabs = st.tabs(["📅 Itinerary", "🏨 Hotels", "🍜 Restaurants", "✈️ Flights & Info"])

# ITINERARY TAB
with tabs[0]:
    st.subheader("10-Day Journey")
    
    city_filter = st.selectbox("Filter by city:", ["All Cities", "Tokyo", "Hakone", "Kyoto", "Osaka", "Narita"])
    
    for day in ITINERARY:
        if city_filter != "All Cities" and day["city"] != city_filter:
            continue
            
        with st.expander(f"**Day {day['day']}** • {day['title']} • {day['date']}"):
            st.markdown(f"**📍 {day['city']}**")
            for act in day["activities"]:
                st.markdown(f"• {act}")

# HOTELS TAB
with tabs[1]:
    st.subheader("Where You're Staying")
    
    for hotel in HOTELS:
        st.markdown(f"""
        <div class="hotel-card">
            <div class="hotel-header">
                <h4>{hotel['city']}</h4>
                <h3>{hotel['name']}</h3>
            </div>
            <div class="hotel-body">
                <div style="display:flex;gap:24px;flex-wrap:wrap;">
                    <span>📅 <b>{hotel['dates']}</b></span>
                    <span>🌙 {hotel['nights']} night{'s' if hotel['nights'] > 1 else ''}</span>
                    <span>🔖 {hotel['conf']}</span>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

# RESTAURANTS TAB
with tabs[2]:
    st.subheader("Where to Eat")
    
    col1, col2 = st.columns(2)
    with col1:
        rest_city = st.selectbox("City:", ["All", "Tokyo", "Hakone", "Kyoto", "Osaka"])
    with col2:
        diet_filter = st.selectbox("Dietary:", ["All", "Vegetarian (Riya)", "Picky (Lara)", "No Beef (Tejal)"])
    
    st.markdown('<div class="rest-grid">', unsafe_allow_html=True)
    
    for r in RESTAURANTS:
        if rest_city != "All" and r["city"] != rest_city:
            continue
        if diet_filter == "Vegetarian (Riya)" and "vegetarian" not in r["diet"] and "all" not in r["diet"]:
            continue
        if diet_filter == "Picky (Lara)" and "picky" not in r["diet"] and "all" not in r["diet"]:
            continue
        if diet_filter == "No Beef (Tejal)" and "nobeef" not in r["diet"] and "all" not in r["diet"] and "vegetarian" not in r["diet"]:
            continue
            
        diet_html = ""
        if "vegetarian" in r["diet"]:
            diet_html += '<span class="diet-tag diet-veg">🌿 Veg</span>'
        if "picky" in r["diet"]:
            diet_html += '<span class="diet-tag diet-picky">👧 Kid</span>'
        if "nobeef" in r["diet"]:
            diet_html += '<span class="diet-tag diet-nobeef">🚫🥩 No Beef</span>'
        if "all" in r["diet"] and not any(d in ["vegetarian", "picky", "nobeef"] for d in r["diet"]):
            diet_html += '<span class="diet-tag diet-veg">✓ All</span>'
        
        st.markdown(f"""
        <div class="rest-card">
            <h4 class="rest-name">{r['name']}</h4>
            <div class="rest-city">{r['city']}</div>
            <span class="rest-type">{r['type']}</span>
            <p style="color:{colors['muted']};margin:8px 0;font-size:0.9rem;">{r['note']}</p>
            <div>{diet_html}</div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

# FLIGHTS & INFO TAB
with tabs[3]:
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown(f"""
        <div class="card">
            <div class="card-header">
                <div class="card-icon">✈️</div>
                <div>
                    <h3 class="card-title">Flights</h3>
                    <div class="card-subtitle">Confirmation: JWT23D</div>
                </div>
            </div>
            <div style="color:{colors['muted']};">
                <p><b>Outbound UA79</b><br>
                Mar 31, 11:25 AM EWR → Apr 1, 2:30 PM NRT</p>
                <p><b>Return UA78</b><br>
                Apr 10, 5:15 PM NRT → 5:00 PM EWR</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown(f"""
        <div class="card">
            <div class="card-header">
                <div class="card-icon">🚨</div>
                <div>
                    <h3 class="card-title">Emergency</h3>
                </div>
            </div>
            <div style="color:{colors['muted']};">
                <p><b>Police:</b> 110<br>
                <b>Fire/Ambulance:</b> 119<br>
                <b>Tokyo English:</b> 03-3201-3330</p>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="card">
            <div class="card-header">
                <div class="card-icon">💡</div>
                <div>
                    <h3 class="card-title">Essential Tips</h3>
                </div>
            </div>
            <div style="color:{colors['muted']};">
                • Carry ¥10,000-20,000 cash/day<br>
                • 7-Eleven ATMs accept foreign cards<br>
                • Get Suica/Pasmo at airport<br>
                • Download Google Translate offline<br>
                • Pocket WiFi pickup at NRT
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown(f"""
        <div class="card">
            <div class="card-header">
                <div class="card-icon">👨‍👩‍👧‍👧</div>
                <div>
                    <h3 class="card-title">Family Notes</h3>
                </div>
            </div>
            <div style="color:{colors['muted']};">
                <b>Riya (14):</b> Mostly vegetarian, eats chicken<br>
                <b>Lara (12):</b> Picky, prefers bland foods<br>
                <b>Tejal:</b> Seafood/chicken, no beef<br>
                <b>Prashant:</b> No restrictions
            </div>
        </div>
        """, unsafe_allow_html=True)
