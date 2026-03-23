import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

class GmailSMTPService:
    """Gmail SMTP E-Mail Service für JKB Grounds"""
    
    def __init__(self):
        self.smtp_server = "smtp.gmail.com"
        self.port = 587
        self.sender_email = os.getenv("GMAIL_EMAIL")
        self.sender_password = os.getenv("GMAIL_APP_PASSWORD")
        
        if not self.sender_email or not self.sender_password:
            logger.warning("Gmail SMTP nicht konfiguriert - E-Mails werden nicht gesendet")
    
    async def send_booking_confirmation(
        self, 
        recipient_email: str, 
        booking_details: dict,
        user_name: str = "Kunde"
    ) -> bool:
        """Sendet Buchungsbestätigung per Gmail SMTP"""
        
        if not self.sender_email or not self.sender_password:
            logger.error("Gmail SMTP nicht konfiguriert")
            return False
        
        try:
            # E-Mail zusammenstellen
            message = MIMEMultipart("alternative")
            message["Subject"] = f"Buchungsbestätigung - {booking_details.get('date', '')}"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # E-Mail Content
            html_content = self._create_booking_email_html(booking_details, user_name)
            text_content = self._create_booking_email_text(booking_details, user_name)
            
            # MIME parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # Gmail SMTP senden
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.smtp_server, self.port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, recipient_email, message.as_string())
            
            logger.info(f"✅ E-Mail erfolgreich gesendet an {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ E-Mail Fehler: {str(e)}")
            return False
    
    def _create_booking_email_html(self, booking_details: dict, user_name: str) -> str:
        """Erstellt HTML E-Mail Content"""
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border: 1px solid #ddd; border-radius: 8px; }}
                .header {{ background: #2E8B57; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; }}
                .booking-details {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail-row {{ margin: 10px 0; }}
                .label {{ font-weight: bold; color: #333; }}
                .value {{ color: #666; }}
                .footer {{ text-align: center; color: #999; font-size: 12px; padding: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎾 JKB Tennisclub</h1>
                    <h2>Buchungsbestätigung</h2>
                </div>
                
                <div class="content">
                    <p>Liebe/r {user_name},</p>
                    
                    <p>Ihre Buchung wurde erfolgreich bestätigt!</p>
                    
                    <div class="booking-details">
                        <h3>📋 Buchungsdetails:</h3>
                        <div class="detail-row">
                            <span class="label">Datum:</span> 
                            <span class="value">{booking_details.get('date', 'Nicht angegeben')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Uhrzeit:</span> 
                            <span class="value">{booking_details.get('time', 'Nicht angegeben')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Dauer:</span> 
                            <span class="value">{booking_details.get('duration', 60)} Minuten</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Platz:</span> 
                            <span class="value">Platz {booking_details.get('platz_id', 'N/A')}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Buchungstyp:</span> 
                            <span class="value">{booking_details.get('type', 'Standard')}</span>
                        </div>
                    </div>
                    
                    <p>Bei Fragen erreichen Sie uns unter:</p>
                    <ul>
                        <li>📧 E-Mail: info@jkb-tennisclub.de</li>
                        <li>📞 Telefon: +49 (0) 123 456789</li>
                    </ul>
                    
                    <p>Wir freuen uns auf Ihren Besuch!</p>
                    <p>Ihr JKB Tennisclub Team</p>
                </div>
                
                <div class="footer">
                    <p>Diese E-Mail wurde automatisch generiert.</p>
                    <p>JKB Tennisclub | Musterstraße 123 | 12345 Musterstadt</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _create_booking_email_text(self, booking_details: dict, user_name: str) -> str:
        """Erstellt Text E-Mail Content (Fallback)"""
        
        return f"""
JKB Tennisclub - Buchungsbestätigung

Liebe/r {user_name},

Ihre Buchung wurde erfolgreich bestätigt!

Buchungsdetails:
- Datum: {booking_details.get('date', 'Nicht angegeben')}
- Uhrzeit: {booking_details.get('time', 'Nicht angegeben')}  
- Dauer: {booking_details.get('duration', 60)} Minuten
- Platz: Platz {booking_details.get('platz_id', 'N/A')}
- Buchungstyp: {booking_details.get('type', 'Standard')}

Bei Fragen erreichen Sie uns unter:
- E-Mail: info@jkb-tennisclub.de
- Telefon: +49 (0) 123 456789

Wir freuen uns auf Ihren Besuch!
Ihr JKB Tennisclub Team

---
Diese E-Mail wurde automatisch generiert.
JKB Tennisclub | Musterstraße 123 | 12345 Musterstadt
        """
