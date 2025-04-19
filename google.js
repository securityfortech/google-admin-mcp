import { google } from "googleapis";

// Google Admin SDK configuration
const SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.group',
];

// Authentication helper function
export async function loadSavedCredentials() {
  try {
    const tokenJson = process.env.GOOGLE_TOKEN_JSON;
    if (!tokenJson) {
      throw new Error('GOOGLE_TOKEN_JSON environment variable is not set');
    }
    
    const decodedToken = Buffer.from(tokenJson, 'base64').toString('utf-8');
    const credentials = JSON.parse(decodedToken);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    console.error('Error loading token:', err);
    throw new Error('Failed to load authentication token. Please ensure GOOGLE_TOKEN_JSON is set and valid.');
  }
}

// Helper function to generate secure password
export function generateSecurePassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  password += charset.match(/[A-Z]/)[0];
  password += charset.match(/[a-z]/)[0];
  password += charset.match(/[0-9]/)[0];
  password += charset.match(/[!@#$%^&*]/)[0];
  
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// List users function
export async function listUsers(domain) {
  try {
    const auth = await loadSavedCredentials();
    const service = google.admin({ version: 'directory_v1', auth });
    
    const response = await service.users.list({
      domain: domain,
      maxResults: 10,
      orderBy: 'email',
    });

    const users = response.data.users;
    if (!users || users.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No users found."
        }]
      };
    }

    const userList = users.map(user => `${user.primaryEmail} (${user.name?.fullName || 'Unknown'})`).join('\n');
    return {
      content: [{
        type: "text",
        text: `Users:\n${userList}`
      }]
    };
  } catch (error) {
    console.error('Error listing users:', error);
    throw new Error(`Failed to list users: ${error.message}`);
  }
}

// Create user function
export async function addUser(primaryEmail, firstName, lastName) {
  try {
    const auth = await loadSavedCredentials();
    const service = google.admin({ version: 'directory_v1', auth });
    
    const password = generateSecurePassword();
    
    const response = await service.users.insert({
      requestBody: {
        primaryEmail: primaryEmail,
        password: password,
        name: {
          givenName: firstName,
          familyName: lastName,
          fullName: `${firstName} ${lastName}`,
        },
        changePasswordAtNextLogin: true,
      },
    });

    const user = response.data;
    return {
      content: [{
        type: "text",
        text: `User created successfully:\nEmail: ${user.primaryEmail}\nName: ${user.name.fullName}\nInitial Password: ${password}\n\nNote: User must change password on first login.`
      }]
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

// Suspend user function
export async function suspendUser(userKey) {
  try {
    const auth = await loadSavedCredentials();
    const service = google.admin({ version: 'directory_v1', auth });
    
    const response = await service.users.update({
      userKey: userKey,
      requestBody: {
        suspended: true
      }
    });

    const user = response.data;
    return {
      content: [{
        type: "text",
        text: `User suspended successfully:\nEmail: ${user.primaryEmail}\nName: ${user.name.fullName}`
      }]
    };
  } catch (error) {
    console.error('Error suspending user:', error);
    throw new Error(`Failed to suspend user: ${error.message}`);
  }
}

// Unsuspend user function
export async function unsuspendUser(userKey) {
  try {
    const auth = await loadSavedCredentials();
    const service = google.admin({ version: 'directory_v1', auth });
    
    const response = await service.users.update({
      userKey: userKey,
      requestBody: {
        suspended: false
      }
    });

    const user = response.data;
    return {
      content: [{
        type: "text",
        text: `User unsuspended successfully:\nEmail: ${user.primaryEmail}\nName: ${user.name.fullName}`
      }]
    };
  } catch (error) {
    console.error('Error unsuspending user:', error);
    throw new Error(`Failed to unsuspend user: ${error.message}`);
  }
}

// Get user function
export async function getUser(userKey) {
  try {
    const auth = await loadSavedCredentials();
    const service = google.admin({ version: 'directory_v1', auth });
    
    const response = await service.users.get({
      userKey: userKey,
    });

    const user = response.data;
    const details = [
      `Email: ${user.primaryEmail}`,
      `Name: ${user.name?.fullName || 'Unknown'}`,
      `ID: ${user.id}`,
      `Admin: ${user.isAdmin || false}`,
      `Suspended: ${user.suspended || false}`,
      `Last Login: ${user.lastLoginTime || 'Never'}`,
      `Created: ${user.creationTime}`,
      `Org Unit: ${user.orgUnitPath || 'Default'}`,
      `Aliases: ${(user.aliases || []).join(', ') || 'None'}`,
      `2FA Enabled: ${user.isEnrolledIn2Sv || false}`,
      `2FA Enforcement: ${user.isEnforcedIn2Sv || false}`,
      `IP Whitelisted: ${user.ipWhitelisted || false}`,
      `Recovery Email: ${user.recoveryEmail || 'Not set'}`,
      `Recovery Phone: ${user.recoveryPhone || 'Not set'}`,
      `Suspension Reason: ${user.suspensionReason || 'Not specified'}`
    ].join('\n');

    return {
      content: [{
        type: "text",
        text: `User Details:\n${details}`
      }]
    };
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
} 