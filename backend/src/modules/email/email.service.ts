import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private mailjet: any;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    try {
      // Use CommonJS require which doesn't have TypeScript issues
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const MailjetClient = require('node-mailjet');
      
      // Try different initialization methods
      try {
        // First try the v6.x.x constructor approach
        this.mailjet = new MailjetClient({
          apiKey: this.configService.get<string>('MAILJET_API_KEY'),
          apiSecret: this.configService.get<string>('MAILJET_SECRET_KEY')
        });
        this.logger.log('Mailjet initialized with constructor method');
      } catch (error) {
        // Fallback to older connect method
        this.mailjet = MailjetClient.connect(
          this.configService.get<string>('MAILJET_API_KEY'),
          this.configService.get<string>('MAILJET_SECRET_KEY')
        );
        this.logger.log('Mailjet initialized with connect method');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Mailjet client', error.stack);
    }
  }

  async sendUserCreationEmail(userEmail: string, userName: string, password?: string): Promise<boolean> {
    try {
      const senderEmail = this.configService.get<string>('MAILJET_SENDER_EMAIL');
      const senderName = this.configService.get<string>('MAILJET_SENDER_NAME');
      const appUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

      if (!this.mailjet) {
        throw new Error('Mailjet client is not initialized');
      }

      // Create a beautiful HTML template with the user's credentials
      const htmlContent = this.createEmailTemplate({
        userName,
        userEmail,
        password,
        appUrl,
        companyName: senderName
      });

      const result = await this.mailjet
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: senderEmail,
                Name: senderName
              },
              To: [
                {
                  Email: userEmail,
                  Name: userName
                }
              ],
              Subject: "Welcome to Intelligent Accounting Management - Your Account Details",
              TextPart: this.createTextVersion({
                userName,
                userEmail,
                password,
                appUrl,
                companyName: senderName
              }),
              HTMLPart: htmlContent
            }
          ]
        });

      this.logger.log(`Email sent to ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${userEmail}`, error.stack);
      return false;
    }
  }

  private createTextVersion({ userName, userEmail, password, appUrl, companyName }: { 
    userName: string; 
    userEmail: string; 
    password?: string;
    appUrl: string;
    companyName: string;
  }): string {
    return `
Hello ${userName},

Welcome to Intelligent Accounting Management! Your account has been created successfully.

Your login credentials:
- Email: ${userEmail}
${password ? `- Password: ${password}` : ''}

You can login to your account at: ${appUrl}

Please keep your credentials secure.

Best regards,
The ${companyName} Team
    `;
  }

  private createEmailTemplate({ userName, userEmail, password, appUrl, companyName }: { 
    userName: string; 
    userEmail: string; 
    password?: string;
    appUrl: string;
    companyName: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Intelligent Accounting Management</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2c3e50;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border-left: 1px solid #e0e0e0;
      border-right: 1px solid #e0e0e0;
    }
    .credentials-box {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 20px;
      margin: 20px 0;
    }
    .credentials-item {
      margin-bottom: 10px;
      display: flex;
    }
    .credentials-label {
      font-weight: bold;
      width: 100px;
    }
    .button {
      display: inline-block;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
    }
    .footer {
      background-color: #ecf0f1;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #7f8c8d;
      border-radius: 0 0 5px 5px;
      border: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Intelligent Accounting Management</h1>
    </div>
    <div class="content">
      <p>Hello ${userName},</p>
      <p>Your account has been created successfully. You can now access all our services and features.</p>
      
      <div class="credentials-box">
        <h3>Your Login Credentials</h3>
        <div class="credentials-item">
          <span class="credentials-label">Email:</span>
          <span>${userEmail}</span>
        </div>
        ${password ? `
        <div class="credentials-item">
          <span class="credentials-label">Password:</span>
          <span>${password}</span>
        </div>
        ` : ''}
      </div>
      
      <p>Please keep your credentials secure and don't share them with others.</p>
      
      <a href="${appUrl}" class="button">Login to Your Account</a>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
      
      <p>Best regards,<br>The ${companyName} Team</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
      <p>This is an automated email, please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
} 