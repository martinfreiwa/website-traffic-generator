# TrafficGen Pro - Preisstruktur & Übersicht

## Übersicht

TrafficGen Pro verwendet ein **tier-basiertes Qualitätssystem** mit gestaffelten Volumenpreisen und Mengenrabatten. Alle Preise verstehen sich in **EUR** und enthalten die gesetzliche Mehrwertsteuer.

---

## 1. Traffic-Tiers (Qualitätsstufen)

| Tier | Qualitätsfaktor | Preis (%) | Features |
|------|-----------------|-----------|----------|
| **Economy** | 0.35 | 35% | Residential IPs, Direct Traffic Only, Standard Proxy Pool, No Geo Targeting |
| **Professional** | 0.65 | 65% | Residential Geo IPs, Country Geo Targeting, RSS and Sitemap Support, URL Shorteners |
| **Expert** | 1.00 | 100% | State & City Targeting, Night & Day Volume, Automatic Website Crawler, GA4 Natural Events |

> Der **Qualitätsfaktor** multipliziert den Basispreis. Expert ist der Referenzpreis (100%), Professional kostet 65%, Economy 35% des Expert-Preises.

---

## 2. Volumen-Stufen (Volume Steps)

Die **Volumenstufen** bestimmen den CPM-Grundpreis (Cost per 1.000 Besucher):

| Volumen | CPM (€) |
|---------|---------|
| < 100.000 | €0.50 |
| 100.000 - 499.999 | €0.45 |
| 500.000 - 999.999 | €0.35 |
| 1.000.000 - 9.999.999 | €0.30 |
| 10.000.000 - 49.999.999 | €0.21 |
| ≥ 50.000.000 | €0.20 |

> **CPM** = Cost per Mille (pro 1.000 Besucher)

---

## 3. Mengenrabatte (Bulk Packages)

| Pack | Faktor | Rabatt |
|------|--------|--------|
| 1x | 1.0 | 0% (Standard) |
| 6x | 0.8 | **20%** |
| 24x | 0.6 | **40%** |

Der Mengenrabatt wird auf die Gesamtmenge (Volumen × Pack-Größe) angewendet.

---

## 4. Komplette Preisliste (Pricing Matrix)

### Economy Tier (Faktor 0.35)

| Volumen | 1x (0% Rabatt) | 6x (-20%) | 24x (-40%) |
|---------|-----------------|-----------|------------|
| 60.000 | €9.96 | €47.81 | €143.42 |
| 500.000 | €57.96 | €278.21 | €834.62 |
| 1.000.000 | €99.96 | €479.81 | €1.439,42 |
| 10.000.000 | €699.96 | €3.359,81 | €10.079,42 |
| 50.000.000 | €2.799,96 | €13.439,81 | €40.319,42 |

### Professional Tier (Faktor 0.65)

| Volumen | 1x (0% Rabatt) | 6x (-20%) | 24x (-40%) |
|---------|-----------------|-----------|------------|
| 60.000 | €19.96 | €95.81 | €287.42 |
| 500.000 | €115.92 | €556.42 | €1.669,25 |
| 1.000.000 | €199.96 | €959.81 | €2.879,42 |
| 10.000.000 | €1.399,96 | €6.719,81 | €20.159,42 |
| 50.000.000 | €5.599,96 | €26.879,81 | €80.639,42 |

### Expert Tier (Faktor 1.00)

| Volumen | 1x (0% Rabatt) | 6x (-20%) | 24x (-40%) |
|---------|-----------------|-----------|------------|
| 60.000 | €29.96 | €143.81 | €431.42 |
| 500.000 | €173.96 | €835.01 | €2.505,02 |
| 1.000.000 | €299.96 | €1.439,81 | €4.319,42 |
| 10.000.000 | €2.099,96 | €10.079,81 | €30.239,42 |
| 50.000.000 | €8.399,96 | €40.319,81 | €120.959,42 |

---

## 5. Berechnungsformel (Campaign Pricing)

Für einzelne Kampagnen im Dashboard wird der Preis wie folgt berechnet:

```
Kosten = (Besucher / 1.000) × CPM × Tier-Faktor
```

### CPM basierend auf Gesamtvolumen:

| Volumen | CPM (€) |
|---------|---------|
| < 100.000 | €0.50 |
| < 500.000 | €0.45 |
| < 1.000.000 | €0.35 |
| < 10.000.000 | €0.30 |
| < 50.000.000 | €0.21 |
| ≥ 50.000.000 | €0.20 |

### Tier-Faktoren:

- **Expert**: 1.00 (voller Preis)
- **Professional**: 0.65 (65% des Expert-Preises)
- **Economy**: 0.35 (35% des Expert-Preises)

### Beispielrechnungen:

| Tier | Besucher | CPM | Berechnung | Kosten |
|------|----------|-----|------------|-------|
| Economy | 100.000 | €0.45 | (100.000/1.000) × 0.45 × 0.35 | €15,75 |
| Professional | 100.000 | €0.45 | (100.000/1.000) × 0.45 × 0.65 | €29,25 |
| Expert | 100.000 | €0.45 | (100.000/1.000) × 0.45 × 1.00 | €45,00 |
| Expert | 1.000.000 | €0.30 | (1.000.000/1.000) × 0.30 × 1.00 | €300,00 |

---

## 6. Affiliate-Programm

| Parameter | Wert |
|-----------|------|
| Provision | **20%** des Kaufbetrags |
| Auszahlung | Wird dem Referrer-Balance gutgeschrieben |
| Gültig für | Alle Käufe (Credit Packs & Kampagnen) |

---

## 7. Zahlungsmethoden

| Methode | Details |
|---------|---------|
| **Kreditkarte** | Stripe (EUR), sofortige Gutschrift |
| **Banküberweisung** | USD, EUR, GBP, AUD, RON via Wise, Gutschrift nach Bestätigung |
| **Apple Pay** | Nur HTTPS, simuliert im Demo-Modus |

### Bankverbindungen (Wise):

- **EUR**: IBAN: BE86 9679 9171 7050, SWIFT: TRWIBEB1XXX
- **USD**: Account: 8314422210, Routing: 026073150
- **GBP**: Account: 46701141, Sort-Code: 23-08-01
- **AUD**: Account: 218673731, BSB: 774-001
- **RON**: IBAN: RO60 BREL 0005 6028 6239 0100

---

## 8. Minimale Anforderungen

| Parameter | Minimum |
|-----------|---------|
| Besucher pro Kampagne | 1.000 |
| Kampagnendauer | 1 Tag |
| Tier-Anforderung | Economy: Direct Traffic nur |

---

*Stand: Februar 2026*
