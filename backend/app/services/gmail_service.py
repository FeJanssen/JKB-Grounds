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

    async def send_password_reset_email(self, recipient_email: str, user_name: str, reset_token: str) -> bool:
        """Sendet Passwort-Reset-Email per Gmail SMTP"""
        
        if not self.sender_email or not self.sender_password:
            logger.error("Gmail SMTP nicht konfiguriert")
            return False
        
        try:
            # E-Mail zusammenstellen
            message = MIMEMultipart("alternative")
            message["Subject"] = "Passwort zurücksetzen - JKB Tennisclub"
            message["From"] = self.sender_email
            message["To"] = recipient_email
            
            # E-Mail Content
            html_content = self._create_password_reset_email_html(user_name, reset_token)
            text_content = self._create_password_reset_email_text(user_name, reset_token)
            
            # MIME parts
            text_part = MIMEText(text_content, "plain")
            html_part = MIMEText(html_content, "html")
            
            message.attach(text_part)
            message.attach(html_part)
            
            # E-Mail senden
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.port) as server:
                server.starttls(context=context)
                server.login(self.sender_email, self.sender_password)
                server.send_message(message)
            
            logger.info(f"Passwort-Reset-Email erfolgreich gesendet an: {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Fehler beim Senden der Passwort-Reset-Email an {recipient_email}: {e}")
            return False

    def _create_password_reset_email_html(self, user_name: str, reset_token: str) -> str:
        """Erstellt HTML-Content für Passwort-Reset-Email"""
        # Web-URL für Browser/Testing und Deep Link für mobile App
        web_url = f"https://main.d1wyodl7lpyx0o.amplifyapp.com/reset-password/{reset_token}"
        deep_link_url = f"jkbgrounds://reset-password/{reset_token}"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Passwort zurücksetzen</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #DC143C; margin: 0;">JKB Tennisclub</h1>
                <h2 style="color: #666; margin: 10px 0 0 0; font-weight: normal;">Passwort zurücksetzen</h2>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <p style="margin: 0 0 15px 0; font-size: 16px;">Hallo {user_name},</p>
                
                <p style="margin: 0 0 20px 0;">Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
                
                <p style="margin: 0 0 20px 0;">Klicken Sie auf einen der folgenden Buttons, um Ihr neues Passwort zu vergeben:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{web_url}" 
                       style="background-color: #DC143C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 5px;">
                        🌐 Im Browser öffnen
                    </a>
                    <br>
                    <a href="{deep_link_url}" 
                       style="background-color: #2E8B57; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 5px;">
                        📱 In der App öffnen
                    </a>
                </div>
                
                <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
                    Oder kopieren Sie einen dieser Links:
                </p>
                <p style="margin: 0 0 10px 0; color: #DC143C; font-size: 12px; word-break: break-all;">
                    <strong>Browser:</strong> {web_url}
                </p>
                <p style="margin: 0 0 20px 0; color: #2E8B57; font-size: 12px; word-break: break-all;">
                    <strong>App:</strong> {deep_link_url}
                </p>
                
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>Wichtig:</strong> Dieser Link ist nur 1 Stunde gültig. 
                        Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <p style="margin: 0 0 10px 0;">Bei Fragen erreichen Sie uns unter:</p>
                <p style="margin: 0 0 5px 0;">E-Mail: info@jkb-tennisclub.de</p>
                <p style="margin: 0 0 15px 0;">Telefon: +49 (0) 123 456789</p>
                <p style="margin: 0; font-size: 12px; color: #999;">
                    JKB Tennisclub | Musterstraße 123 | 12345 Musterstadt
                </p>
            </div>
        </body>
        </html>
        """

    def _create_password_reset_email_text(self, user_name: str, reset_token: str) -> str:
        """Erstellt Text-Content für Passwort-Reset-Email"""
        # Web-URL für Browser/Testing und Deep Link für mobile App
        web_url = f"https://main.d1wyodl7lpyx0o.amplifyapp.com/reset-password/{reset_token}"
        deep_link_url = f"jkbgrounds://reset-password/{reset_token}"
        
        return f"""
JKB Tennisclub - Passwort zurücksetzen

Hallo {user_name},

Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.

Um Ihr neues Passwort zu vergeben, verwenden Sie einen der folgenden Links:

Browser-Link:
{web_url}

App-Link (falls Sie die mobile App verwenden):
{deep_link_url}

WICHTIG: Diese Links sind nur 1 Stunde gültig.
Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.

Bei Fragen erreichen Sie uns unter:
- E-Mail: info@jkb-tennisclub.de
- Telefon: +49 (0) 123 456789

Ihr JKB Tennisclub Team

---
Diese E-Mail wurde automatisch generiert.
JKB Tennisclub | Musterstraße 123 | 12345 Musterstadt
        """


# Service-Instanz erstellen
gmail_service = GmailSMTPService()
