import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmployeeCredentials {
  employeeId: string;
  email: string;
  name: string;
  password: string;
}

export interface PasswordResetCredentials {
  employeeId: string;
  email: string;
  name: string;
  newPassword: string;
}

export async function sendEmployeeCredentials(credentials: EmployeeCredentials) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@codebord.com',
      to: [credentials.email],
      subject: 'Your Codebord Employee Account Credentials',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Codebord Employee Account</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background-color: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .codebord-blue { color: #091e65; }
            .codebord-red { color: #dc2626; }
            .credentials-box {
              background-color: #f8f9fa;
              border: 2px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-item {
              margin: 10px 0;
              padding: 10px;
              background-color: white;
              border-radius: 5px;
              border-left: 4px solid #091e65;
            }
            .label {
              font-weight: bold;
              color: #091e65;
              display: inline-block;
              width: 120px;
            }
            .value {
              font-family: 'Courier New', monospace;
              background-color: #f1f3f4;
              padding: 2px 6px;
              border-radius: 3px;
              color: #333;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #6c757d;
              font-size: 14px;
            }
            .login-button {
              display: inline-block;
              background: linear-gradient(135deg, #091e65 0%, #dc2626 100%);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="codebord-blue">CODE</span><span class="codebord-red">BORD</span>
              </div>
              <p style="color: #6c757d; margin: 0;">Employee Portal Access</p>
            </div>
            
            <h2 style="color: #091e65; margin-bottom: 20px;">Welcome to Codebord!</h2>
            
            <p>Hello <strong>${credentials.name}</strong>,</p>
            
            <p>Your employee account has been successfully created. Below are your login credentials:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <span class="label">Employee ID:</span>
                <span class="value">${credentials.employeeId}</span>
              </div>
              <div class="credential-item">
                <span class="label">Email:</span>
                <span class="value">${credentials.email}</span>
              </div>
              <div class="credential-item">
                <span class="label">Password:</span>
                <span class="value">${credentials.password}</span>
              </div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="login-button">
                Login to Employee Portal
              </a>
            </div>
            
            <p><strong>Login Instructions:</strong></p>
            <ul>
              <li>Visit the employee portal using the button above</li>
              <li>Use either your Employee ID or Email address to login</li>
              <li>Enter the password provided above</li>
              <li>Change your password immediately after first login</li>
            </ul>
            
            <div class="footer">
              <p>This is an automated message from Codebord Employee Management System.</p>
              <p>If you have any questions, please contact your administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

export async function sendPasswordResetCredentials(credentials: PasswordResetCredentials) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@codebord.com',
      to: [credentials.email],
      subject: 'Your Codebord Password Has Been Reset',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Codebord Password Reset</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background-color: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .codebord-blue { color: #091e65; }
            .codebord-red { color: #dc2626; }
            .credentials-box {
              background-color: #f8f9fa;
              border: 2px solid #e9ecef;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-item {
              margin: 10px 0;
              padding: 10px;
              background-color: white;
              border-radius: 5px;
              border-left: 4px solid #dc2626;
            }
            .label {
              font-weight: bold;
              color: #091e65;
              display: inline-block;
              width: 120px;
            }
            .value {
              font-family: 'Courier New', monospace;
              background-color: #f1f3f4;
              padding: 2px 6px;
              border-radius: 3px;
              color: #333;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
            .success {
              background-color: #d1fae5;
              border: 1px solid #a7f3d0;
              border-radius: 5px;
              padding: 15px;
              margin: 20px 0;
              color: #065f46;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e9ecef;
              color: #6c757d;
              font-size: 14px;
            }
            .login-button {
              display: inline-block;
              background: linear-gradient(135deg, #091e65 0%, #dc2626 100%);
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <span class="codebord-blue">CODE</span><span class="codebord-red">BORD</span>
              </div>
              <p style="color: #6c757d; margin: 0;">Password Reset Complete</p>
            </div>
            
            <h2 style="color: #091e65; margin-bottom: 20px;">Password Reset Successful!</h2>
            
            <p>Hello <strong>${credentials.name}</strong>,</p>
            
            <p>Your password reset request has been approved by the administrator. Your account has been updated with new credentials:</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <span class="label">Employee ID:</span>
                <span class="value">${credentials.employeeId}</span>
              </div>
              <div class="credential-item">
                <span class="label">Email:</span>
                <span class="value">${credentials.email}</span>
              </div>
              <div class="credential-item">
                <span class="label">New Password:</span>
                <span class="value">${credentials.newPassword}</span>
              </div>
            </div>
            
            <div class="success">
              <strong>✅ Password Reset Complete:</strong> Your account is now active with the new password provided above.
            </div>
            
            <div class="warning">
              <strong>⚠️ Security Reminder:</strong> Please change your password after logging in for enhanced security.
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" class="login-button">
                Login to Employee Portal
              </a>
            </div>
            
            <p><strong>Login Instructions:</strong></p>
            <ul>
              <li>Visit the employee portal using the button above</li>
              <li>Use either your Employee ID or Email address to login</li>
              <li>Enter the new password provided above</li>
              <li>Change your password immediately after login for security</li>
            </ul>
            
            <div class="footer">
              <p>This is an automated message from Codebord Employee Management System.</p>
              <p>If you have any questions, please contact your administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Password reset email sending error:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Password reset email service error:', error);
    throw error;
  }
}

// Function to generate random password
export function generateRandomPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special character
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
