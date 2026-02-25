# 🍷 Wine Allocation Warfare System

**Command Center for Prashant's Wine Allocation Hunt**

*Last Updated: 2026-02-25*  
*System Version: 2.0*

---

## 🎯 MISSION: Acquire Allocated Northern Rhône Gems

The goal is simple but difficult: **catch allocations before they sell out**. The wines we're hunting are:

| Wine | Priority | Target Price | Rarity | Notes |
|------|----------|--------------|--------|-------|
| **Thierry Allemand Cornas Reynard** | 🔴 HIGH | $350 | 🦄 Unicorn | The Holy Grail. Allocation-only. |
| **Thierry Allemand Cornas Chaillot** | 🔴 HIGH | $300 | 🦄 Rare | Second wine, more available. |
| **Auguste Clape Cornas** | 🔴 HIGH | $250 | 🦄 Rare | Desert island producer. |
| **Pierre Gonon Saint-Joseph** | 🔴 HIGH | $150 | 📦 Limited | Secret handshake wine. |
| Jean-Louis Chave Hermitage | 🟡 MEDIUM | $350 | 🦄 Rare | The King. |
| René Rostaing Côte-Rôtie | 🟡 MEDIUM | $170 | 📦 Limited | Classic elegance. |
| Stéphane Ogier Hermitage | 🟡 MEDIUM | $200 | 📦 Limited | Modern star. |

---

## 🚨 How Alerts Work

### Priority Levels

**🔴 HIGH** - Drop everything. Check immediately.
- Allemand Reynard/Chaillot found in stock
- Clape Cornas allocation announced
- Gonon Saint-Joseph new vintage release

**🟡 MEDIUM** - Check soon (within 1 hour)
- Chave, Rostaing, Ogier in stock
- Price drops on target wines
- Pre-arrival offers

**🟢 LOW** - Monitor when convenient
- Opportunistic wines
- Back-vintage discoveries

### Alert Channels

1. **Memory Files** - Written to `memory/wine-alerts-*.md`
2. **Telegram** - Direct message when critical alerts found

---

## 🛠️ System Components

### 1. Email Scout (`scripts/wine-email-scout.js`)
**Purpose:** Monitor Fastmail inbox for allocation announcements

**Monitored Retailers:**
- **Tier 1** (Check 4x daily): Kermit Lynch, Crush Wine, Rare Wine Co, SommPicks
- **Tier 2** (Check daily): K&L, Saratoga Wine, Flatiron, Chambers Street

**Keywords Tracked:**
```
Primary: allemand, reynard, chaillot, clape, gonon, cornas, allocation
Secondary: arrival, pre-arrival, new release, just landed, available now
Vintages: 2022, 2023, 2024, new vintage
```

**Run manually:**
```bash
node /data/workspace/scripts/wine-email-scout.js
```

**Add to heartbeat:** Checks every 4 hours automatically

---

### 2. Web Monitor (`scripts/wine-web-scout.js`)
**Purpose:** Scrape retailer websites for stock availability

**Sites Monitored:**
- Kermit Lynch (Gonon primary source)
- Crush Wine (Allemand/Clape)
- Rare Wine Co (back-vintages)
- SommPicks (allocations)
- K&L Wine (Chave/Rostaing)

**Run manually:**
```bash
node /data/workspace/scripts/wine-web-scout.js
```

---

### 3. Price Tracker (`scripts/wine-price-tracker.js`)
**Purpose:** Track price history and detect deals

**Features:**
- Records all seen prices
- Alerts on price drops below target
- Historical price charts

**Price Database:** `memory/wine-prices.json`

---

### 4. Inventory Tracker (`memory/wine-cellar.json`)
**Purpose:** Track what you own vs. what you're hunting

**Status Codes:**
- `hunting` - Actively seeking
- `allocated` - On waitlist/pre-ordered
- `purchased` - In cellar
- `consumed` - Already enjoyed
- `monitoring` - Watching for deals

---

## 📊 Current Hunt Status

### 🔴 HIGH Priority - Active Hunt

| Wine | Status | Last Seen | Best Price | Notes |
|------|--------|-----------|------------|-------|
| Allemand Reynard | 🏃 HUNTING | Never | $389 (spec) | Unicorn. Check auctions. |
| Allemand Chaillot | 🏃 HUNTING | Never | $320 (spec) | Rare. Watch Crush Wine. |
| Clape Cornas | 🏃 HUNTING | Feb 2026 | $226 avg | Allocated. Watch email. |
| Gonon Saint-Joseph | 🏃 HUNTING | Feb 2026 | $165 avg | Kermit Lynch restocks. |

### 🟡 MEDIUM Priority - Monitor

| Wine | Status | Last Seen | Best Price | Notes |
|------|--------|-----------|------------|-------|
| Chave Hermitage | 🏃 HUNTING | Feb 2026 | $319 | K&L has 2022. |
| Rostaing Côte-Rôtie | 📡 MONITOR | - | - | Wait for vintage release. |
| Ogier Hermitage | 📡 MONITOR | - | - | Rising star. |

---

## 🏪 Retailer Intelligence

### Kermit Lynch (kermitlynch.com)
- **Best For:** Gonon Saint-Joseph
- **How They Sell:** Email newsletter → Website drop → Sold out in hours
- **Pro Tip:** Sign up for newsletter. Drops usually Tuesday 10am ET.
- **Contact:** info@kermitlynch.com

### Crush Wine (crushwineco.com)
- **Best For:** Allemand, Clape, Chave
- **How They Sell:** Allocations to list members. Request access.
- **Pro Tip:** Email them expressing interest in Rhône allocations.
- **Contact:** info@crushwineco.com

### Rare Wine Co (rarewineco.com)
- **Best For:** Back-vintages, library releases
- **How They Sell:** Waitlists for rare items. Email notifications.
- **Pro Tip:** Get on their Allemand/Clape waitlists NOW.
- **Contact:** sales@rarewineco.com

### SommPicks (sommpicks.com)
- **Best For:** Allemand, emerging producers
- **How They Sell:** Small allocations. Newsletter drops.
- **Pro Tip:** Limited quantities sell fast.
- **Contact:** info@sommpicks.com

---

## 🎯 Hunting Strategy

### Daily Routine (5 min)
1. Check email alerts from overnight
2. Scan wine-email-scout output
3. Quick check: Kermit Lynch, Crush Wine homepages

### Weekly Routine (15 min)
1. Run full web scrape: `node scripts/wine-web-scout.js`
2. Review price tracker for deals
3. Check auction sites (WineBid)
4. Update hunt status in cellar tracker

### When Alert Fires
1. **STOP.** Open the alert immediately.
2. Check if wine is actually available (not just announced)
3. Verify vintage and price are acceptable
4. **BUY FIRST** - allocations vanish in minutes
5. Log purchase in cellar tracker
6. Research later if uncertain

---

## 📝 Logging System

All activity logged to:
- `memory/wine-alerts-{date}.md` - Daily alerts
- `memory/wine-prices.json` - Price history
- `memory/wine-cellar.json` - Purchase tracking
- `logs/wine-hunt-{date}.log` - Detailed logs

---

## 🎓 Wine Knowledge

### Why These Wines?

**Northern Rhône Syrah** is the pinnacle of the grape:
- **Granite soils** = mineral tension, ageability
- **Traditional methods** = whole cluster, native yeast
- **Small production** = allocation-only

**Thierry Allemand** - The most sought-after producer in Cornas. Reynard vineyard is legendary. Makes 2 wines: Reynard (prestige) and Chaillot (more accessible).

**Auguste Clape** - The traditionalist's traditionalist. 100% whole cluster, no new oak. The benchmark for Cornas.

**Pierre Gonon** - Saint-Joseph specialist. Farms granitic soils that give Cornas-like structure. The "secret handshake" wine among sommeliers.

### Allocation Economics

These wines are **not** like commercial Napa Cabernet:
- Production: 500-2000 cases total
- Distribution: Hand-picked retailers
- Release: Once per year, allocation basis
- Secondary market: 2-3x release price

**When you see it available: BUY.** You can always research later.

---

## 🔧 Extending the System

### Add a New Wine

Edit `config/wine-warfare.json`:

```json
{
  "id": "producer-wine-name",
  "name": "Producer Wine Name",
  "aliases": ["search terms"],
  "vintages": ["2021", "2022"],
  "maxPrice": 200,
  "targetPrice": 180,
  "priority": "MEDIUM",
  "notes": "Why you want this",
  "sources": ["retailer1", "retailer2"],
  "status": "hunting"
}
```

### Add a New Retailer

Add to `retailers` section in config:

```json
{
  "name": "Retailer Name",
  "email": "alerts@retailer.com",
  "domain": "retailer.com",
  "specialties": ["wine1", "wine2"],
  "frequency": "check-daily"
}
```

Then update `wine-email-scout.js` keyword list.

### Change Alert Frequency

Edit `settings.huntSchedule` in config:

```json
{
  "fastmailScan": "every-2-hours",
  "webScrape": "daily-5am",
  "priceCheck": "weekly-sunday"
}
```

---

## 🚨 Emergency Contacts

When you see a HIGH priority wine available:

| Retailer | Phone | Email |
|----------|-------|-------|
| Kermit Lynch | 510-524-1524 | info@kermitlynch.com |
| Crush Wine | 212-980-9463 | info@crushwineco.com |
| Rare Wine Co | 707-967-9169 | sales@rarewineco.com |

---

## 💡 Pro Tips

1. **Speed beats research.** If Allemand appears, buy first, ask questions later.

2. **Build relationships.** Email retailers expressing interest. Ask to be notified.

3. **Pre-arrivals are safe.** Buying futures is standard for allocated wines.

4. **Auction backup.** If you miss allocations, WineBid often has back-vintages at fair prices.

5. **Set price alerts.** Use Wine-Searcher alerts for target prices.

6. **Follow on Instagram.** Many retailers announce drops there first.

---

## 📈 Success Metrics

Track your hunt success:
- **Capture Rate:** Allocations secured / Allocations seen
- **Price Efficiency:** Avg price paid / Target price
- **Collection Value:** Current market value of cellar

*Current Goal: Secure 1 Allemand allocation in 2026*

---

## 🛡️ System Maintenance

**Monthly:**
- Review and update target prices based on market
- Clean old alerts from memory
- Update retailer contact info

**Quarterly:**
- Reassess priority levels
- Add/remove wines from watchlist
- Review hunt strategy effectiveness

---

*Happy hunting. May the allocations be ever in your favor.* 🍷⚔️
