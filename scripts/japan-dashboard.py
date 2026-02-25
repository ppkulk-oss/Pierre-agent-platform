#!/usr/bin/env python3
"""
🇯🇵 Japan Family Trip Dashboard
For: Prashant, Tejal, Riya & Lara | April 1-10, 2026

═══════════════════════════════════════════════════════════════════════════════
🚀 DEPLOYMENT OPTIONS
═══════════════════════════════════════════════════════════════════════════════

OPTION 1: Streamlit Cloud (FREE - RECOMMENDED) ⭐
─────────────────────────────────────────────────
1. Push this file to a GitHub repo
2. Go to https://share.streamlit.io
3. Connect your GitHub repo
4. App will be live at: https://your-app-name.streamlit.app
5. Share URL with family - they can bookmark it!
6. Optional: Add secrets.toml for password protection

OPTION 2: Run Locally
─────────────────────
1. Install: pip install streamlit plotly pandas
2. Run: streamlit run scripts/japan-dashboard.py
3. Opens at http://localhost:8501

OPTION 3: Railway (Custom Domain)
──────────────────────────────────
1. Push to GitHub with requirements.txt:
   streamlit
   plotly
   pandas
2. Connect Railway to GitHub repo
3. Deploy and get custom domain

═══════════════════════════════════════════════════════════════════════════════
"""

import streamlit as st
import plotly.graph_objects as go
import pandas as pd
from datetime import datetime, date

# Page config
st.set_page_config(
    page_title="🇯🇵 Japan Trip 2026",
    page_icon="🌸",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for mobile-friendly styling
st.markdown("""
<style>
    .main-header { font-size: 2.5rem; font-weight: bold; color: #E63946; text-align: center; }
    .sub-header { font-size: 1.2rem; color: #457B9D; text-align: center; margin-bottom: 20px; }
    .countdown { font-size: 3rem; font-weight: bold; color: #E63946; text-align: center; }
    .day-label { font-size: 1rem; color: #666; text-align: center; }
    .hotel-card { background: #f0f4f8; padding: 15px; border-radius: 10px; margin: 10px 0; }
    .emergency-box { background: #fff3cd; padding: 15px; border-radius: 10px; border-left: 4px solid #ffc107; }
    .diet-tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin: 2px; }
    .diet-vegetarian { background: #d4edda; color: #155724; }
    .diet-picky { background: #fff3cd; color: #856404; }
    .diet-nobeef { background: #f8d7da; color: #721c24; }
    .stCheckbox > label { font-size: 1rem !important; }
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# DATA
# ═══════════════════════════════════════════════════════════════════════════════

DEPARTURE_DATE = date(2026, 4, 1)

HOTELS = [
    {"name": "Royal Park Hotel Iconic Tokyo Shiodome", "city": "Tokyo", "dates": "Apr 1-4", "lat": 35.663, "lon": 139.759, "nights": 3},
    {"name": "Hakone Kowakien Mikawaya Ryokan", "city": "Hakone", "dates": "Apr 4-5", "lat": 35.239, "lon": 139.046, "nights": 1},
    {"name": "Cross Hotel Kyoto", "city": "Kyoto", "dates": "Apr 5-7", "lat": 35.006, "lon": 135.766, "nights": 2},
    {"name": "Hotel Hankyu RESPIRE OSAKA", "city": "Osaka", "dates": "Apr 7-9", "lat": 34.703, "lon": 135.495, "nights": 2},
    {"name": "Hotel Nikko Narita", "city": "Narita", "dates": "Apr 9-10", "lat": 35.774, "lon": 140.318, "nights": 1},
]

ITINERARY = {
    1: {"date": "Wed, Apr 1", "title": "✈️ Arrival & Tokyo", "city": "Tokyo", "highlights": ["2:30 PM - Arrive NRT", "4:00 PM - Narita Express to Tokyo", "5:30 PM - Check-in Shiodome", "Evening - Gentle exploration"]},
    2: {"date": "Thu, Apr 2", "title": "⛩️ Classic Tokyo", "city": "Tokyo", "highlights": ["9:00 AM - Senso-ji Temple", "11:30 AM - Nakamise Street", "2:30 PM - Tokyo Skytree", "Evening - Dinner in Ginza"]},
    3: {"date": "Fri, Apr 3", "title": "🌟 Pop Culture Day", "city": "Tokyo", "highlights": ["10:00 AM - Meiji Shrine", "12:00 PM - Harajuku/Takeshita St", "3:00 PM - Shibuya Crossing", "3:30 PM - Shibuya Sky"]},
    4: {"date": "Sat, Apr 4", "title": "🏔️ Tokyo → Hakone", "city": "Hakone", "highlights": ["10:00 AM - Romancecar to Hakone", "12:30 PM - Ryokan check-in", "2:30 PM - Hakone Loop Course", "6:30 PM - Kaiseki dinner"]},
    5: {"date": "Sun, Apr 5", "title": "🚅 Hakone → Kyoto", "city": "Kyoto", "highlights": ["7:00 AM - Ryokan breakfast", "2:03 PM - Shinkansen to Kyoto", "5:30 PM - Check-in Cross Hotel", "Evening - Gion stroll"]},
    6: {"date": "Mon, Apr 6", "title": "🎋 Kyoto Temples", "city": "Kyoto", "highlights": ["9:00 AM - Fushimi Inari", "2:00 PM - Kiyomizu-dera", "4:00 PM - Sannenzaka streets", "Evening - Gion dinner"]},
    7: {"date": "Tue, Apr 7", "title": "🌿 Arashiyama → Osaka", "city": "Osaka", "highlights": ["9:30 AM - Bamboo Grove", "10:30 AM - Tenryu-ji Temple", "3:00 PM - Train to Osaka", "6:00 PM - Dotonbori exploration"]},
    8: {"date": "Wed, Apr 8", "title": "🎢 Universal Studios", "city": "Osaka", "highlights": ["8:30 AM - Depart for USJ", "9:00 AM - Park opens", "Full day - Rides & Super Nintendo World", "Evening - Return to hotel"]},
    9: {"date": "Thu, Apr 9", "title": "🏯 Osaka → Narita", "city": "Narita", "highlights": ["10:00 AM - Osaka Castle", "3:00 PM - Train to Narita", "5:00 PM - Check-in Hotel Nikko"]},
    10: {"date": "Fri, Apr 10", "title": "✈️ Departure", "city": "Narita", "highlights": ["8:00 AM - Breakfast", "9:30 AM - Airport shuttle", "5:15 PM - Flight UA78 to EWR"]},
}

RESTAURANTS = [
    {"name": "Sushi Zanmai", "city": "Tokyo", "type": "Conveyor Sushi", "diet": "all", "notes": "Fun for kids, English menu"},
    {"name": "CoCo Ichibanya", "city": "Tokyo", "type": "Japanese Curry", "diet": "all", "notes": "Customizable spice, kid-friendly"},
    {"name": "Daikokuya Tempura", "city": "Tokyo", "type": "Tempura", "diet": "vegetarian", "notes": "Historic shop near Senso-ji"},
    {"name": "Ichiran Ramen", "city": "Tokyo", "type": "Ramen", "diet": "all", "notes": "Private booths, customizable"},
    {"name": "Rainbow Pancake", "city": "Tokyo", "type": "Cafe", "diet": "all", "notes": "Instagram-famous pancakes"},
    {"name": "Hatsuhana Soba", "city": "Hakone", "type": "Soba", "diet": "vegetarian", "notes": "100+ year old soba shop"},
    {"name": "Nishiki Market", "city": "Kyoto", "type": "Food Market", "diet": "all", "notes": "Variety for everyone"},
    {"name": "Shoraian", "city": "Kyoto", "type": "Tofu Cuisine", "diet": "vegetarian", "notes": "Bamboo forest setting - great for Riya"},
    {"name": "Kani Dōraku", "city": "Osaka", "type": "Crab", "diet": "nobeef", "notes": "Famous giant crab sign"},
    {"name": "Takoyaki Juhachiban", "city": "Osaka", "type": "Takoyaki", "diet": "all", "notes": "Osaka specialty"},
    {"name": "Mario Café", "city": "Osaka", "type": "Themed Cafe", "diet": "all", "notes": "Inside USJ - expect waits"},
    {"name": "Three Broomsticks", "city": "Osaka", "type": "Western", "diet": "all", "notes": "Harry Potter themed - good for Lara"},
]

PACKING_ITEMS = [
    ("T-shirts/tanks (4-5)", "clothing"), ("Long-sleeve shirts (2-3)", "clothing"), ("Light sweater (2)", "clothing"),
    ("Light jacket", "clothing"), ("Comfortable walking shoes", "clothing"), ("Slip-on shoes", "clothing"),
    ("Socks (10 pairs, no holes!)", "clothing"), ("Rain jacket/umbrella", "clothing"),
    ("Toothbrush & toothpaste", "toiletries"), ("Deodorant", "toiletries"), ("Sunscreen", "toiletries"),
    ("Prescription meds", "health"), ("Motion sickness pills", "health"), ("Allergy medication", "health"),
    ("Phone charger", "electronics"), ("Power bank", "electronics"), ("Headphones", "electronics"),
    ("Passports", "documents"), ("Flight confirmations (JWT23D)", "documents"), ("Hotel confirmations", "documents"),
    ("Travel insurance", "documents"), ("Credit cards + notify banks", "documents"), ("Cash (yen)", "documents"),
    ("Day backpack", "gear"), ("Reusable water bottle", "gear"), ("Hand wipes", "gear"),
    ("Snacks for picky eater", "gear"), ("Journal for memories", "gear"),
]

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_countdown():
    today = date.today()
    days_left = (DEPARTURE_DATE - today).days
    return days_left

def create_map():
    fig = go.Figure()
    
    # Add route line
    lats = [h["lat"] for h in HOTELS]
    lons = [h["lon"] for h in HOTELS]
    
    fig.add_trace(go.Scattermapbox(
        lat=lats, lon=lons, mode='lines+markers',
        line=dict(color='#E63946', width=3),
        marker=dict(size=15, color='#457B9D'),
        text=[f"{h['city']}: {h['name']}" for h in HOTELS],
        hovertemplate='<b>%{text}</b><extra></extra>',
        name='Route'
    ))
    
    # City labels
    for i, h in enumerate(HOTELS):
        fig.add_annotation(
            x=h["lon"], y=h["lat"],
            text=h["city"],
            showarrow=False,
            yshift=20,
            font=dict(size=12, color="#333")
        )
    
    fig.update_layout(
        mapbox=dict(
            style="carto-positron",
            center=dict(lat=35.5, lon=138),
            zoom=6
        ),
        showlegend=False,
        margin=dict(l=0, r=0, t=0, b=0),
        height=400
    )
    return fig

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN APP
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    # Header
    st.markdown('<div class="main-header">🇯🇵 Japan Family Adventure 2026</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Prashant, Tejal, Riya & Lara | April 1-10</div>', unsafe_allow_html=True)
    
    # Countdown
    days_left = get_countdown()
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown(f'<div class="countdown">{days_left}</div>', unsafe_allow_html=True)
        st.markdown('<div class="day-label">days until departure 🌸</div>', unsafe_allow_html=True)
    
    st.divider()
    
    # Tabs
    tabs = st.tabs(["📅 Itinerary", "🗺️ Map", "🍜 Restaurants", "🎒 Packing", "📞 Quick Ref"])
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TAB 1: ITINERARY
    # ═══════════════════════════════════════════════════════════════════════════
    with tabs[0]:
        st.subheader("10-Day Adventure")
        
        # City filter
        city_filter = st.selectbox("Filter by city:", ["All", "Tokyo", "Hakone", "Kyoto", "Osaka", "Narita"])
        
        for day_num, day_data in ITINERARY.items():
            if city_filter != "All" and day_data["city"] != city_filter:
                continue
            
            with st.expander(f"Day {day_num}: {day_data['title']}"):
                st.write(f"**📍 {day_data['city']} | {day_data['date']}**")
                for highlight in day_data["highlights"]:
                    st.write(f"• {highlight}")
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TAB 2: MAP
    # ═══════════════════════════════════════════════════════════════════════════
    with tabs[1]:
        st.subheader("Tokyo → Hakone → Kyoto → Osaka → Narita")
        st.plotly_chart(create_map(), use_container_width=True)
        
        st.subheader("🏨 Hotels")
        for hotel in HOTELS:
            st.markdown(f"""
            <div class="hotel-card">
                <b>{hotel['city']}</b> ({hotel['dates']})<br>
                {hotel['name']}<br>
                <small>🌙 {hotel['nights']} night{'s' if hotel['nights'] > 1 else ''}</small>
            </div>
            """, unsafe_allow_html=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TAB 3: RESTAURANTS
    # ═══════════════════════════════════════════════════════════════════════════
    with tabs[2]:
        st.subheader("Family-Friendly Dining")
        
        # Diet legend
        col1, col2, col3 = st.columns(3)
        with col1:
            st.markdown('<span class="diet-tag diet-vegetarian">✓ Riya (Vegetarian)</span>', unsafe_allow_html=True)
        with col2:
            st.markdown('<span class="diet-tag diet-picky">✓ Lara (Picky)</span>', unsafe_allow_html=True)
        with col3:
            st.markdown('<span class="diet-tag diet-nobeef">✓ Tejal (No Beef)</span>', unsafe_allow_html=True)
        
        st.write("")
        
        # Filters
        col1, col2 = st.columns(2)
        with col1:
            rest_city = st.selectbox("City:", ["All", "Tokyo", "Hakone", "Kyoto", "Osaka"], key="rest_city")
        with col2:
            diet_filter = st.selectbox("Dietary need:", ["All", "Vegetarian (Riya)", "Kid-friendly (Lara)", "No beef (Tejal)"], key="diet_filter")
        
        # Filter restaurants
        filtered = RESTAURANTS
        if rest_city != "All":
            filtered = [r for r in filtered if r["city"] == rest_city]
        if diet_filter == "Vegetarian (Riya)":
            filtered = [r for r in filtered if r["diet"] in ["vegetarian", "all"]]
        elif diet_filter == "Kid-friendly (Lara)":
            filtered = [r for r in filtered if "Lara" in r["notes"] or r["type"] in ["Cafe", "Western", "Food Market"]]
        elif diet_filter == "No beef (Tejal)":
            filtered = [r for r in filtered if r["diet"] in ["nobeef", "all", "vegetarian"]]
        
        # Display
        for r in filtered:
            tags = ""
            if r["diet"] == "vegetarian":
                tags += '<span class="diet-tag diet-vegetarian">Veg</span> '
            if r["diet"] == "nobeef":
                tags += '<span class="diet-tag diet-nobeef">No Beef</span> '
            
            st.markdown(f"""
            <div class="hotel-card">
                <b>{r['name']}</b> {tags}<br>
                <small>{r['city']} • {r['type']}</small><br>
                <small>💡 {r['notes']}</small>
            </div>
            """, unsafe_allow_html=True)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TAB 4: PACKING
    # ═══════════════════════════════════════════════════════════════════════════
    with tabs[3]:
        st.subheader("📋 Packing Checklist")
        
        # Initialize session state for checkboxes
        if "packed" not in st.session_state:
            st.session_state.packed = set()
        
        # Progress
        total = len(PACKING_ITEMS)
        packed_count = len(st.session_state.packed)
        progress = packed_count / total
        
        col1, col2 = st.columns([3, 1])
        with col1:
            st.progress(progress)
        with col2:
            st.write(f"**{packed_count}/{total}** items")
        
        # Categories
        categories = {"clothing": "👕 Clothing", "toiletries": "🧴 Toiletries", 
                     "health": "💊 Health", "electronics": "📱 Electronics",
                     "documents": "📄 Documents", "gear": "🎒 Gear"}
        
        for cat_key, cat_name in categories.items():
            with st.expander(cat_name):
                items = [i for i in PACKING_ITEMS if i[1] == cat_key]
                for item, _ in items:
                    key = f"pack_{item}"
                    checked = item in st.session_state.packed
                    if st.checkbox(item, value=checked, key=key):
                        st.session_state.packed.add(item)
                    else:
                        st.session_state.packed.discard(item)
        
        if st.button("Clear All"):
            st.session_state.packed = set()
            st.rerun()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TAB 5: QUICK REFERENCE
    # ═══════════════════════════════════════════════════════════════════════════
    with tabs[4]:
        st.subheader("🚨 Emergency & Essential Info")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            <div class="emergency-box">
                <h4>🚨 Emergency Numbers</h4>
                <b>Police:</b> 110<br>
                <b>Fire/Ambulance:</b> 119<br>
                <b>Tokyo English Hotline:</b> 03-3201-3330
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
            <div class="hotel-card">
                <h4>✈️ Flights (Conf: JWT23D)</h4>
                <b>Outbound UA79:</b><br>
                Mar 31, 11:25 AM EWR → Apr 1, 2:30 PM NRT<br><br>
                <b>Return UA78:</b><br>
                Apr 10, 5:15 PM NRT → 5:00 PM EWR
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown("""
            <div class="hotel-card">
                <h4>💡 Essential Tips</h4>
                • Carry ¥10,000-20,000 cash/day<br>
                • 7-Eleven ATMs accept foreign cards<br>
                • Get Suica/Pasmo IC cards at airport<br>
                • Download Google Translate (offline)<br>
                • Pocket WiFi reserved - pick up at NRT
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown("""
            <div class="hotel-card">
                <h4>👨‍👩‍👧‍👧 Family Diet Notes</h4>
                <b>Riya (14):</b> Mostly vegetarian, eats chicken<br>
                <b>Lara (12):</b> Picky, prefers bland foods<br>
                <b>Tejal:</b> Seafood/chicken, no beef<br>
                <b>Prashant:</b> No restrictions
            </div>
            """, unsafe_allow_html=True)
        
        st.subheader("🏨 Hotel Confirmations")
        hotel_df = pd.DataFrame([
            {"City": h["city"], "Hotel": h["name"], "Dates": h["dates"], "Nights": h["nights"]}
            for h in HOTELS
        ])
        st.dataframe(hotel_df, use_container_width=True, hide_index=True)

if __name__ == "__main__":
    main()
