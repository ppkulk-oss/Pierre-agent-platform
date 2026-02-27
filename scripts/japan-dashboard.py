#!/usr/bin/env python3
"""
🇯🇵 JAPAN TRAVEL DASHBOARD
For: Prashant, Tejal, Riya & Lara | April 1-10, 2026
"""

import streamlit as st
from datetime import date

st.set_page_config(
    page_title="Japan 2026",
    page_icon="🗾",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Data
DEPARTURE = date(2026, 4, 1)
DAYS_LEFT = (DEPARTURE - date.today()).days

TRAVELERS = [
    {"name": "Prashant", "note": "", "color": "🔴"},
    {"name": "Tejal", "note": "no beef", "color": "🔵"},
    {"name": "Riya", "note": "vegetarian", "color": "🟣"},
    {"name": "Lara", "note": "picky", "color": "🟡"},
]

DESTINATIONS = [
    {"city": "Tokyo", "jp": "東京", "nights": 3, "dates": "Apr 1-4",
     "hotel": "Royal Park Hotel Iconic Shiodome",
     "highlights": "Senso-ji Temple, Shibuya Crossing, Tokyo Skytree"},
    {"city": "Hakone", "jp": "箱根", "nights": 1, "dates": "Apr 4-5",
     "hotel": "Mikawaya Ryokan",
     "highlights": "Hot Springs, Mt. Fuji Views, Kaiseki Dinner"},
    {"city": "Kyoto", "jp": "京都", "nights": 2, "dates": "Apr 5-7",
     "hotel": "Cross Hotel Kyoto",
     "highlights": "Fushimi Inari, Kiyomizu-dera, Gion District"},
    {"city": "Osaka", "jp": "大阪", "nights": 2, "dates": "Apr 7-9",
     "hotel": "Hotel Hankyu RESPIRE",
     "highlights": "Dotonbori, Universal Studios, Osaka Castle"},
    {"city": "Narita", "jp": "成田", "nights": 1, "dates": "Apr 9-10",
     "hotel": "Hotel Nikko Narita",
     "highlights": "Narita-san Temple, Last Minute Shopping"},
]

# CSS - using st.html for proper injection
st.html("""
<style>
.block-container { max-width: 100% !important; padding: 0 !important; }
header { visibility: hidden; }
.stApp { background: #0f0f23; }
</style>
""")

# Hero Section
st.markdown("""
<div style="background: linear-gradient(135deg, #0f0f23 0%, #1a1b3a 50%, #2d1b4e 100%); 
            padding: 60px 40px; text-align: center; border-radius: 0;">
    <p style="color: #ffd700; font-size: 14px; letter-spacing: 4px; margin-bottom: 20px;">
        🌸 THE JOURNEY AWAITS
    </p>
    <h1 style="color: white; font-size: 72px; margin: 0; font-weight: 700;">Japan</h1>
    <p style="color: #ff6b9d; font-size: 32px; margin: 10px 0;">日本</p>
    <p style="color: rgba(255,255,255,0.8); font-size: 18px; max-width: 600px; margin: 20px auto;">
        A family adventure through five cities, ten days, and countless memories.
    </p>
    <div style="background: rgba(255,255,255,0.1); display: inline-block; padding: 15px 30px; 
                border-radius: 50px; margin: 20px 0;">
        <span style="color: white; font-size: 18px;">April 1 → April 10, 2026</span>
    </div>
    <div style="margin: 30px 0;">
        <span style="font-size: 64px; font-weight: 700; 
                     background: linear-gradient(135deg, #ff6b9d, #ffd700); 
                     -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            {days}
        </span>
        <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin-top: 5px;">DAYS UNTIL</p>
    </div>
</div>
""".format(days=DAYS_LEFT))

# Travelers
st.markdown("### 👨‍👩‍👧‍👧 Travelers")
cols = st.columns(4)
for i, t in enumerate(TRAVELERS):
    with cols[i]:
        st.metric(label=t["name"], value=t["color"], delta=t["note"])

st.divider()

# Destinations
st.markdown("## 🗾 The Route")
st.caption("Tokyo → Hakone → Kyoto → Osaka → Narita")

for dest in DESTINATIONS:
    with st.container():
        col1, col2 = st.columns([1, 2])
        with col1:
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, #1a1b3a, #2d1b4e); 
                        padding: 30px; border-radius: 16px; text-align: center;">
                <p style="color: #ffd700; font-size: 12px; margin: 0;">NIGHTS</p>
                <p style="color: white; font-size: 48px; margin: 0; font-weight: 700;">{dest['nights']}</p>
                <p style="color: rgba(255,255,255,0.6); font-size: 14px; margin: 5px 0;">{dest['dates']}</p>
            </div>
            """, unsafe_allow_html=True)
        with col2:
            st.subheader(f"{dest['city']} {dest['jp']}")
            st.write(f"🏨 **{dest['hotel']}**")
            st.caption(dest['highlights'])
    st.divider()

# Flights
st.markdown("## ✈️ Flights")
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Outbound", "UA79", "Mar 31, 11:25 AM")
    st.caption("EWR → NRT, arrives Apr 1, 2:30 PM")
with col2:
    st.metric("Return", "UA78", "Apr 10, 5:15 PM")
    st.caption("NRT → EWR, arrives 5:00 PM")
with col3:
    st.metric("Confirmation", "JWT23D", "United Economy")
    st.caption("4 passengers, 2 free bags each")

# Emergency & Tips
st.divider()
col1, col2 = st.columns(2)
with col1:
    st.markdown("### 🚨 Emergency Numbers")
    st.write("- Police: 110")
    st.write("- Fire/Ambulance: 119")
    st.write("- Tokyo English Hotline: 03-3201-3330")
with col2:
    st.markdown("### 💡 Essential Tips")
    st.write("- Carry ¥10,000-20,000 cash/day")
    st.write("- Get Suica/Pasmo at airport")
    st.write("- Download offline Google Translate")
    st.write("- Pocket WiFi pickup at NRT")
