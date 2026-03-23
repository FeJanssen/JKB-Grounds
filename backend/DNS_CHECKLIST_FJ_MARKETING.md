# 🔍 DNS CHECKLIST für fj-marketing.com SES Verifizierung

## ✅ BEREITS HINZUGEFÜGT (vor 3 Tagen):
```
CNAME Records für DKIM:
1. bo6m722jukbrimasfdhu255tomkeai3c._domainkey.fj-marketing.com → bo6m722jukbrimasfdhu255tomkeai3c.dkim.amazonses.com
2. pkiiht3v7rby27ny73225hqm2s2ixoex._domainkey.fj-marketing.com → pkiiht3v7rby27ny73225hqm2s2ixoex.dkim.amazonses.com  
3. 2cspbiixjxpkxlvpcerxvznnw6v4pndp._domainkey.fj-marketing.com → 2cspbiixjxpkxlvpcerxvznnw6v4pndp.dkim.amazonses.com
```

## ❌ FEHLT NOCH - KRITISCH FÜR VERIFIZIERUNG:

### 1️⃣ HAUPT-TXT RECORD für Domain Verifizierung:
```
Name/Host: _amazonses.fj-marketing.com
Type: TXT
Value: [WERT AUS AWS SES KONSOLE BENÖTIGT]
```

**⚠️ WICHTIG**: Dieser TXT Record ist der Hauptgrund, warum die Verifizierung seit 3 Tagen hängt!

### 2️⃣ WO FINDEN SIE DEN WERT:
1. Gehen Sie zu AWS SES Konsole
2. Klicken Sie auf "Verified identities" 
3. Klicken Sie auf "fj-marketing.com"
4. Kopieren Sie den TXT Record Wert

## 🔧 NÄCHSTE SCHRITTE:

1. **Loggen Sie sich in WordPress Domain-Provider ein**
2. **Fügen Sie den TXT Record hinzu:**
   - Name: `_amazonses.fj-marketing.com`
   - Type: `TXT` 
   - Value: `[Wert aus AWS SES Konsole]`

3. **Warten Sie 1-24 Stunden** (DNS Propagation)

## 🧪 NACH DNS UPDATE TESTEN:
```bash
dig TXT _amazonses.fj-marketing.com +short
```

Sollte den AWS Verifizierungs-Code zurückgeben.
