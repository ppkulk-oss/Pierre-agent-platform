#!/usr/bin/env python3
"""
🇯🇵 Japan Trip Dashboard v3.0 - Native Streamlit Edition
For: Prashant, Tejal, Riya & Lara | April 1-10, 2026

Built with Streamlit native components for maximum compatibility.
Professional, clean, works everywhere.

Run: streamlit run scripts/japan-dashboard.py
"""

import streamlit as st
from datetime import date

# ═══════════════════════════════════════════════════════════════════════════════
# PAGE CONFIG
# ═══════════════════════════════════════════════════════════════════════════════
st.set_page_config(
    page_title="Japan 2026 | Family Trip",
    page_icon="🌸",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOM CSS (Limited but compatible with Streamlit Cloud)
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown("""
<style>
    .main-header {
        font-size: 3.5rem !important;
        font-weight: 700;
        background: linear-gradient(90deg, #FF6B6B, #4ECDC4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        margin-bottom: 0;
    }
    .sub-header {
        font-size: 1.2rem;
        color: #666;
        text-align: center;
        margin-bottom: 2rem;
    }
    .japanese-text {
        font-size: 1.5rem;
        color: #FF6B6B;
        text-align: center;
        margin-bottom: 1rem;
    }
    .countdown-big {
        font-size: 4rem;
        font-weight: 700;
        color: #FF6B6B;
        text-align: center;
    }
    .countdown-label {
        font-size: 1rem;
        color: #666;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.2em;
    }
</style>
""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════════════════════════════
# DATA
# ═══════════════════════════════════════════════════════════════════════════════
DEPARTURE = date(2026, 4, 1)
DAYS_LEFT = (DEPARTURE - date.today()).days

DESTINATIONS = [
    {"city": "Tokyo", "jp": "東京", "nights": 3, "dates": "Apr 1-4", 
     "hotel": "Royal Park Hotel Iconic Shiodome", "conf": "6210444904",
     "desc": "Neon-lit metropolis where ancient temples meet futuristic technology.",
     "highlights": ["⛩️ Senso-ji Temple", "🌃 Shibuya Crossing", "🗼 Tokyo Skytree", "👘 Harajuku"]},
    {"city": "Hakone", "jp": "箱根", "nights": 1, "dates": "Apr 4-5",
     "hotel": "Mikawaya Ryokan", "conf": "Exp: 72068424131155",
     "desc": "Mountain hot springs with views of Mount Fuji and traditional kaiseki.",
     "highlights": ["♨️ Hot Springs", "🗻 Mt. Fuji Views", "🍱 Kaiseki Dinner", "🚡 Hakone Ropeway"]},
    {"city": "Kyoto", "jp": "京都", "nights": 2, "dates": "Apr 5-7",
     "hotel": "Cross Hotel Kyoto", "conf": "Exp: 72068669603342",
     "desc": "Ancient capital with thousands of temples, geishas, and bamboo groves.",
     "highlights": ["⛩️ Fushimi Inari", "🎋 Bamboo Grove", "👘 Gion District", "🏛️ Kiyomizu-dera"]},
    {"city": "Osaka", "jp": "大阪", "nights": 2, "dates": "Apr 7-9",
     "hotel": "Hotel Hankyu RESPIRE", "conf": "Exp: 72068670183986",
     "desc": "Japan's kitchen, famous for street food, neon lights, and Universal Studios.",
     "highlights": ["🌃 Dotonbori", "🎢 Universal Studios", "🏯 Osaka Castle", "🍜 Street Food"]},
    {"city": "Narita", "jp": "成田", "nights": 1, "dates": "Apr 9-10",
     "hotel": "Hotel Nikko Narita", "conf": "Exp: 72068692164929",
     "desc": "Peaceful temple town before departure.",
     "highlights": ["⛩️ Narita-san Temple", "🛍️ Last Shopping", "✈️ Airport Shuttle"]},
]

RESTAURANTS = [
    ("Sushi Zanmai", "Tokyo", "Conveyor Sushi", "Fun for kids, English menu", "all"),
    ("CoCo Ichibanya", "Tokyo", "Curry", "Customizable spice levels", "all"),
    ("Daikokuya Tempura", "Tokyo", "Tempura", "Historic shop near Senso-ji", "vegetarian"),
    ("Ichiran Ramen", "Tokyo", "Ramen", "Private booths, customizable", "all"),
    ("Rainbow Pancake", "Tokyo", "Cafe", "Instagram-famous pancakes", "all"),
    ("Hatsuhana Soba", "Hakone", "Soba", "100+ year old soba shop", "vegetarian"),
    ("Nishiki Market", "Kyoto", "Food Market", "Variety for everyone", "all"),
    ("Shoraian", "Kyoto", "Tofu Cuisine", "Bamboo forest setting", "vegetarian"),
    ("Kani Dōraku", "Osaka", "Crab", "Famous giant crab sign", "nobeef"),
    ("Takoyaki Juhachiban", "Osaka", "Takoyaki", "Osaka specialty", "all"),
    ("Mario Café", "Osaka", "Themed Cafe", "Inside USJ", "all"),
]

# ═══════════════════════════════════════════════════════════════════════════════
# HERO SECTION
# ═══════════════════════════════════════════════════════════════════════════════
st.markdown('<h1 class="main-header">🌸 Japan 2026</h1>', unsafe_allow_html=True)
st.markdown('<p class="japanese-text">家族旅行 • Family Journey</p>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">Prashant, Tejal, Riya & Lara • April 1-10 • 5 Cities</p>', unsafe_allow_html=True)

# Countdown
col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    st.markdown(f'<div class="countdown-big">{DAYS_LEFT}</div>', unsafe_allow_html=True)
    st.markdown('<div class="countdown-label">Days Until Departure</div>', unsafe_allow_html=True)

st.divider()

# ═══════════════════════════════════════════════════════════════════════════════
# TRAVELERS
# ═══════════════════════════════════════════════════════════════════════════════
st.subheader("👨‍👩‍👧‍👧 The Travelers")
cols = st.columns(4)
travelers = [
    ("Prashant", "👨‍💼", "No restrictions", "#FF6B6B"),
    ("Tejal", "👩‍💼", "No beef", "#4ECDC4"),
    ("Riya (14)", "👧", "Vegetarian", "#9B59B6"),
    ("Lara (12)", "👧", "Picky eater", "#F39C12"),
]
for col, (name, emoji, note, color) in zip(cols, travelers):
    with col:
        st.metric(label=f"{emoji} {name}", value=note)

st.divider()

# ═══════════════════════════════════════════════════════════════════════════════
# DESTINATIONS
# ═══════════════════════════════════════════════════════════════════════════════
st.subheader("🗾 The Journey")

tabs = st.tabs([f"{d['city']} {d['jp']}" for d in DESTINATIONS])

for tab, dest in zip(tabs, DESTINATIONS):
    with tab:
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.header(f"{dest['city']} • {dest['jp']}")
            st.caption(f"📅 {dest['dates']} • 🌙 {dest['nights']} nights")
            st.write(dest['desc'])
            
            st.subheader("Highlights")
            for h in dest['highlights']:
                st.markdown(f"- {h}")
        
        with col2:
            st.info(f"**🏨 Staying at:**\n{dest['hotel']}")
            st.caption(f"Confirmation: {dest['conf']}")

st.divider()

# ═══════════════════════════════════════════════════════════════════════════════
# RESTAURANTS
# ═══════════════════════════════════════════════════════════════════════════════
st.subheader("🍜 Where to Eat")

col1, col2 = st.columns(2)
with col1:
    city_filter = st.selectbox("Filter by city:", ["All", "Tokyo", "Hakone", "Kyoto", "Osaka"])
with col2:
    diet_filter = st.selectbox("Dietary preference:", 
                              ["All", "Vegetarian (Riya)", "No Beef (Tejal)", "Kid-friendly (Lara)"])

filtered_restaurants = []
for name, city, rtype, note, diet in RESTAURANTS:
    if city_filter != "All" and city != city_filter:
        continue
    if diet_filter == "Vegetarian (Riya)" and diet not in ["vegetarian", "all"]:
        continue
    if diet_filter == "No Beef (Tejal)" and diet not in ["nobeef", "all", "vegetarian"]:
        continue
    filtered_restaurants.append((name, city, rtype, note, diet))

# Display in grid
if filtered_restaurants:
    cols = st.columns(3)
    for i, (name, city, rtype, note, diet) in enumerate(filtered_restaurants):
        with cols[i % 3]:
            with st.container(border=True):
                st.caption(f"📍 {city}")
                st.write(f"**{name}**")
                st.caption(rtype)
                st.caption(note)
                
                # Diet badges
                badges = []
                if diet == "vegetarian":
                    badges.append("🌿 Vegetarian")
                elif diet == "nobeef":
                    badges.append("🚫🥩 No Beef")
                elif diet == "all":
                    badges.append("✓ All diets")
                if badges:
                    st.caption(" • ".join(badges))

st.divider()

# ═══════════════════════════════════════════════════════════════════════════════
# FLIGHTS
# ═══════════════════════════════════════════════════════════════════════════════
st.subheader("✈️ Flights")

col1, col2 = st.columns(2)

with col1:
    st.success("""
    **Outbound: UA79**
    
    March 31, 11:25 AM  
    Newark (EWR) → Tokyo Narita (NRT)  
    Arrives: April 1, 2:30 PM
    """)

with col2:
    st.success("""
    **Return: UA78**
    
    April 10, 5:15 PM  
    Tokyo Narita (NRT) → Newark (EWR)  
    Arrives: 5:00 PM same day
    """)

st.info("**Confirmation:** JWT23D  •  **Class:** United Economy (W)  •  **Baggage:** 2 free checked bags per person")

st.divider()

# ═══════════════════════════════════════════════════════════════════════════════
# ESSENTIAL INFO
# ═══════════════════════════════════════════════════════════════════════════════
st.subheader("📋 Essential Info")

col1, col2, col3 = st.columns(3)

with col1:
    st.warning("""
    **🚨 Emergency Numbers**
    
    Police: 110  
    Fire/Ambulance: 119  
    Tokyo English Hotline: 03-3201-3330
    """)

with col2:
    st.info("""
    **💡 Pro Tips**
    
    • Carry ¥10,000-20,000 cash/day  
    • Get Suica/Pasmo at airport  
    • 7-Eleven ATMs accept foreign cards  
    • Download offline Google Translate
    """)

with col3:
    st.info("""
    **👨‍👩‍👧‍👧 Family Notes**
    
    **Riya (14):** Vegetarian  
    **Lara (12):** Picky eater  
    **Tejal:** No beef  
    **Prashant:** No restrictions
    """)

st.divider()
st.caption("🌸 Japan Family Trip 2026 • Built with Streamlit • Last updated: February 2026")
