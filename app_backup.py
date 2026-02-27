from flask import Flask, render_template
from datetime import date

app = Flask(__name__)

@app.route('/')
def home():
    departure = date(2026, 4, 1)
    days_left = (departure - date.today()).days
    
    travelers = [
        {"name": "Prashant", "initial": "P", "note": "", "color": "#ff6b9d"},
        {"name": "Tejal", "initial": "T", "note": "no beef", "color": "#0d7377"},
        {"name": "Riya", "initial": "R", "note": "vegetarian", "color": "#9b59b6"},
        {"name": "Lara", "initial": "L", "note": "picky", "color": "#ffd700"},
    ]
    
    destinations = [
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
    
    restaurants = [
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
    
    return render_template('index.html', days_left=days_left, travelers=travelers, 
                          destinations=destinations, restaurants=restaurants)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
