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
    {"name": "Tejal", "initial": "T", "note": "seafood and chicken, no beef", "color": "#0d7377"},
    {"name": "Riya", "initial": "R", "note": "vegetarian, eats chicken", "color": "#9b59b6"},
    {"name": "Lara", "initial": "L", "note": "picky eater, likes bland foods", "color": "#ffd700"},
]

DESTINATIONS = [
    {
        "city": "Tokyo", 
        "jp": "東京",
        "prefecture": "Kanto",
        "nights": 3,
        "dates": "Apr 1-4",
        "hotel": "The Royal Park Hotel Iconic Tokyo Shiodome",
        "address": "105-8333, Tokyo, Minato Ward, Minato-ku, Higashishimbashi 1-6-3 Japan",
        "phone": "+81 3-6253-1111",
        "room": "Junior Suite Twin Room + 2 Extra beds (614 ft²)",
        "conf": "6210444904",
        "pin": "5140",
        "check_in": "3:00 PM - 11:30 PM",
        "check_out": "11:00 AM",
        "price": "¥406,620"
    },
    {
        "city": "Hakone",
        "jp": "箱根",
        "prefecture": "Kanagawa",
        "nights": 1,
        "dates": "Apr 4-5",
        "hotel": "Hakone Kowakien Mikawaya Ryokan",
        "address": "503 Kowakudani, Hakone, Kanagawa, 250-0406 Japan",
        "room": "2 Japanese-style Twin rooms, Annex (No bathroom), Non Smoking",
        "conf": "Expedia: 72068424131155",
        "check_in": "3:00 PM",
        "check_out": "10:00 AM",
        "features": "Wagyu & Kaiseki Dinner and Breakfast included"
    },
    {
        "city": "Kyoto",
        "jp": "京都",
        "prefecture": "Kyoto",
        "nights": 2,
        "dates": "Apr 5-7",
        "hotel": "Cross Hotel Kyoto",
        "address": "71-1 Daikokucho, Kawaramachi-dori, Sanjo-sagaru, Nakagyo-ku, Kyoto, 604-8031 Japan",
        "room": "[NON SMOKING] Deluxe Family Twin Room",
        "conf": "Expedia: 72068669603342",
        "check_in": "3:00 PM",
        "check_out": "11:00 AM"
    },
    {
        "city": "Osaka",
        "jp": "大阪",
        "prefecture": "Osaka",
        "nights": 2,
        "dates": "Apr 7-9",
        "hotel": "Hotel Hankyu RESPIRE OSAKA",
        "address": "1-1 Ofukacho, Kita, Osaka, 530-0011 Japan",
        "room": "Connecting Room for 5 people, Non Smoking",
        "conf": "Expedia: 72068670183986",
        "check_in": "3:00 PM",
        "check_out": "12:00 PM"
    },
    {
        "city": "Narita",
        "jp": "成田",
        "prefecture": "Chiba",
        "nights": 1,
        "dates": "Apr 9-10",
        "hotel": "Hotel Nikko Narita",
        "address": "500 Tokko, Narita, Chiba-ken, 286-0106 Japan",
        "room": "Japanese Style Family Room-Main Building, Non Smoking",
        "conf": "Expedia: 72068692164929",
        "check_in": "3:00 PM",
        "check_out": "11:00 AM",
        "features": "Free Breakfast"
    }
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
    {"name": "Mario Café", "city": "Osaka", "type": "Themed Cafe", "tags": ["USJ"], "diet": "all"}
]

# Rest of the file remains unchanged...