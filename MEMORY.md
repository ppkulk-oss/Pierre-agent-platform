# MEMORY.md - Long-Term Memory

## Family
- **Daughters**: Lara (12) and Riya (14)
  - **Ski Level**: Level 5 (as of Feb 2026 - Beaver Creek trip)
  - Both intermediate skiers, can handle blues comfortably
  - Riya: Mostly vegetarian, eats chicken
  - Lara: Picky eater, likes bland foods (mac & cheese, plain pasta)
- **Wife**: Tejal
  - Eats seafood and chicken, no beef

## Wine Preferences
- **Burgundy enthusiast** - loves Bonnes-Mares (Grand Cru)
- **Hunting**: Thierry Allemand Cornas Reynard (Northern Rhône Syrah) — *on hold until fall 2026*
- **Collection**: Has Dugat-Py La Petite Levrière
- **Style**: Terroir-driven, structured wines - no fruit bombs
- **No cellar** - drinks by the bottle, prefers young-drinking wines
- **Flemington source** mentioned for wine purchases
- **Deal Hunter**: Looking for exceptional value buys (e.g., 2006 Haut-Brion at $450 — benchmark for "amazing deals")

## Travel
### Beaver Creek, CO (Feb 7-11, 2026)
- **Great success** - both girls skied all 3 days
- Riya had Flu B on arrival but recovered
- Ski school worth it - girls reached Level 5
- Beano's Cabin cancelled (insufficient snow for snowcat)
- **Would return** - bookmark for future

### Travel Style
- Family of 4 ski trips
- Budget-conscious but willing to splurge selectively
- Prefers unique experiences (snowcat dinner) over generic luxury

### Japan Trip (April 1-10, 2026)
**Party**: Family of 4 (Prashant, Tejal, Riya, Lara Kulkarni)

**Flights** (United Airlines - Confirmation: JWT23D):
| Flight | Date | Route | Time | Details |
|--------|------|-------|------|---------|
| UA79 | Tue, Mar 31, 2026 | Newark (EWR) → Tokyo Narita (NRT) | Depart 11:25 AM | Arrives Wed, Apr 1 at 2:30 PM |
| UA78 | Fri, Apr 10, 2026 | Tokyo Narita (NRT) → Newark (EWR) | Depart 5:15 PM | Arrive 5:00 PM same day |

- Class: United Economy (W)
- Total Cost: $5,881.72 (paid $4,369.72 + 216K miles)
- Seats: 50K/50L/50F/50J (outbound), 51K/51L/51F/51J (return)
- eTicket Numbers: 0162343149791-0162343149794
- Baggage: 2 free checked bags per person (50 lbs/23 kg each)
- Booked: Oct 25, 2025

**Hotels**:
1. **Apr 1-4: Tokyo** - The Royal Park Hotel Iconic Tokyo Shiodome
   - Address: 105-8333, Tokyo, Minato Ward, Minato-ku, Higashishimbashi 1-6-3 Japan
   - Phone: +81 3-6253-1111
   - 1 room: Junior Suite Twin Room + 2 Extra beds (4 person)
   - Room size: 614 ft²
   - Check-in: Wed, Apr 1, 3:00 PM - 11:30 PM
   - Check-out: Sat, Apr 4, until 11:00 AM
   - Price: ¥406,620
   - Confirmation: 6210444904, PIN: 5140
   - Updated: Nov 28, 2025

2. **Apr 4-5: Hakone** - Hakone Kowakien Mikawaya Ryokan
   - Address: 503 Kowakudani, Hakone, Kanagawa, 250-0406 Japan
   - 2 rooms, Wagyu & Kaiseki Dinner and Breakfast included
   - Japanese-style Twin room, Annex (No bathroom), Non Smoking
   - Check-in: 3:00 PM, Check-out: 10:00 AM
   - Expedia Itinerary: 72068424131155

3. **Apr 5-7: Kyoto** - Cross Hotel Kyoto
   - Address: 71-1 Daikokucho, Kawaramachi-dori, Sanjo-sagaru, Nakagyo-ku, Kyoto, 604-8031 Japan
   - 1 room: [NON SMOKING] Deluxe Family Twin Room
   - Check-in: 3:00 PM, Check-out: 11 AM
   - Expedia Itinerary: 72068669603342

4. **Apr 7-9: Osaka** - Hotel Hankyu RESPIRE OSAKA
   - Address: 1-1 Ofukacho, Kita, Osaka, 530-0011 Japan
   - 1 room: Connecting Room for 5 people, Non Smoking
   - Check-in: 3:00 PM, Check-out: noon
   - Expedia Itinerary: 72068670183986

5. **Apr 9-10: Narita** - Hotel Nikko Narita
   - Address: 500 Tokko, Narita, Chiba-ken, 286-0106 Japan
   - 1 room: Japanese Style Family Room-Main Building, Non Smoking
   - Includes Free Breakfast
   - Check-in: 3:00 PM, Check-out: 11 AM
   - Expedia Itinerary: 72068692164929

**Notes**:
- All hotels booked via Expedia (booked Nov 2025)
- Free cancellation available on all bookings
- Mix of traditional (ryokan) and modern hotels
- Strategic routing: Tokyo → Hakone → Kyoto → Osaka → Narita (departure)

### Future Travel Wishlist
- **Appenzell, Switzerland** - wants to visit (noted Feb 2026)

## Locations
- **Home**: Holmdel, NJ (07733)
- **Timezone**: US Eastern Standard Time (EST/ET) — default all time references to ET
- **Airport**: EWR (Newark Liberty)

## Car/Maintenance
- **Audi Key Battery**: How-to video - https://youtu.be/CurWSFtxRl4 (saved Feb 2024)
  - Note: Tricky part is the **angle of the flathead screwdriver**
  - Reference image: `memory/audi-key-battery.jpg` (saved Feb 2026)

## Pierre Lessons Learned
- **2026-02-06**: Never claim to make phone calls without VoIP enabled
- **2026-02-07**: Always verify attachments BEFORE answering (flight time disaster)
- **2026-02-08**: Set actual reminders when promising to ping about meds
- **2026-02-27**: **Streamlit ≠ Flask** — For custom designed UIs with full CSS control, use Flask + Jinja2 templates. Streamlit sanitizes CSS heavily even with `unsafe_allow_html=True`. Flask serves raw HTML without restrictions.
- **General**: Say "I don't know" instead of hallucinating confirmation numbers

## Technical Reference
### Web Dashboard Deployment (Railway)
**For custom-designed dashboards with animations/gradients:**
- Use **Flask** + `templates/index.html` + Gunicorn
- Structure: `app.py`, `templates/`, `requirements.txt` (flask, gunicorn), `railway.json`
- Never use Streamlit for creative/design-heavy UIs — it's built for data apps, not custom styling
- Railway auto-detects project type by files in root (package.json = Node, requirements.txt = Python)

## Movies to Watch
- **The Rover** - Added Feb 25, 2026

---
*This is Pierre's curated long-term memory. Updated after significant events/learnings.*
