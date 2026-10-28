====================================================================
GOOGLE WORKSPACE (CALENDAR & PEOPLE API) OAUTH2 HAZIRLIK ADIMLARI
====================================================================

1. Google Cloud Projesi Oluşturma:
   • https://console.cloud.google.com adresine gidin.
   • 'Yeni Proje' oluşturun (Örn: "WhatsApp Asistan").

2. API'leri Etkinleştirme:
   • 'APIs & Services' > 'Library' sekmesine gidin.
   • "Google Calendar API" aratıp ETKİNLEŞTİRİN.
   • "Google People API" aratıp ETKİNLEŞTİRİN.

3. OAuth Consent Screen (Onay Ekranı):
   • 'OAuth consent screen' sekmesinde 'External' seçin.
   • Scopes (İzinler) kısmına şunları ekleyin:
     - https://www.googleapis.com/auth/calendar.events
     - https://www.googleapis.com/auth/contacts

4. Client ID & Secret Alma:
   • 'Credentials' > 'Create Credentials' > 'OAuth Client ID' tıklayın.
   • Uygulama türü: "Web application"
   • Authorized redirect URI:
     https://developers.google.com/oauthplayground

5. Refresh Token (Kalıcı Token) Alma:
   • https://developers.google.com/oauthplayground adresine gidin.
   • Sağ üstteki çarktan (Settings) "Use your own OAuth credentials" kutusunu işaretleyin.
   • Client ID ve Secret yapıştırıp Calendar v3 ve People v1 izinlerini onaylayın.
   • "Exchange authorization code for tokens" butonuna basarak 'Refresh token' elde edin.