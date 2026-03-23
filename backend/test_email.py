#!/usr/bin/env python3
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_test_email():
    try:
        # Gmail SMTP Konfiguration
        sender_email = 'jkbgrounds@gmail.com'
        password = 'hacs elvu lgmt nhag'
        recipient = 'office@fj-marketing.com'
        
        # E-Mail zusammenstellen
        message = MIMEMultipart("alternative")
        message["Subject"] = "🎾 JKB Tennisclub - TEST Buchungsbestätigung"
        message["From"] = sender_email
        message["To"] = recipient
        
        # HTML Content
        html_content = """
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                <div style="background: #2E8B57; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1>🎾 JKB Tennisclub</h1>
                    <h2>TEST Buchungsbestätigung</h2>
                </div>
                <div style="padding: 30px;">
                    <p>Liebe/r Test User,</p>
                    <p><strong>Dies ist ein TEST der E-Mail-Bestätigung!</strong></p>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>📅 Datum:</strong> 8. März 2026</p>
                        <p><strong>🕐 Uhrzeit:</strong> 10:00 - 11:00 Uhr</p>
                        <p><strong>🎾 Platz:</strong> Tennis-Platz TEST</p>
                        <p><strong>💰 Preis:</strong> 25,00 €</p>
                    </div>
                    <p>Wenn Sie diese E-Mail erhalten, funktioniert das Gmail SMTP System!</p>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        JKB Tennisclub | TEST Buchungsbestätigung
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # HTML Part erstellen
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        print('📧 Sende TEST Buchungsbestätigung...')
        
        # SSL Context für Lambda-Kompatibilität
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        
        # E-Mail senden
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls(context=context)
            server.login(sender_email, password)
            server.sendmail(sender_email, recipient, message.as_string())
            
        print('✅ TEST BUCHUNGSBESTÄTIGUNG ERFOLGREICH GESENDET!')
        print('📬 CHECK POSTFACH: office@fj-marketing.com')
        
    except Exception as e:
        print(f'❌ ERROR: {e}')

if __name__ == "__main__":
    send_test_email()
