# Lambda 502 Fehler - Systematische Diagnose

## PRIORITÄT 1: CloudWatch Logs prüfen
- [ ] AWS Console → CloudWatch → Log groups öffnen
- [ ] `/aws/lambda/[FUNKTIONS-NAME]` Log Group finden
- [ ] Neueste Log Streams öffnen
- [ ] Fehlermeldungen bei Zeitstempel der curl-Tests suchen

## Lambda Konfiguration prüfen
- [ ] Handler: Ist es `lambda_handler.lambda_handler` oder `basic_test.lambda_handler`?
- [ ] Runtime: Python 3.9, 3.10, oder 3.11?
- [ ] Timeout: Mindestens 30 Sekunden?
- [ ] Memory: Mindestens 128 MB?
- [ ] Environment Variables: Sind welche gesetzt?

## Mögliche Fehlerursachen:
1. **Handler nicht gefunden**: `lambda_handler.py` fehlt oder falscher Handler-Name
2. **Import Fehler**: Dependencies fehlen oder sind inkompatibel  
3. **Python Version**: Lambda Runtime vs. lokale Version
4. **File Permissions**: ZIP-Package Struktur falsch
5. **Memory/Timeout**: Funktion braucht zu viele Ressourcen

## Test-Packages zum Hochladen:
- `lambda_basic_test.zip` - Nur Python Standard Library
- `lambda_ultra_test.zip` - Mit FastAPI Dependencies
- `lambda_test_minimal.zip` - Mit ausgewählten Dependencies

## Debugging Commands:
```bash
# ZIP Inhalt prüfen
unzip -l lambda_basic_test.zip

# CloudWatch Logs live verfolgen
aws logs tail /aws/lambda/FUNKTIONS-NAME --follow

# Lambda Funktion Information
aws lambda get-function --function-name FUNKTIONS-NAME
```
