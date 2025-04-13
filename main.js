import { FastMCP } from "fastmcp";
import { z } from "zod";
import { google } from "googleapis";

// Google Admin SDK configuration
const SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.group',
];

// Authentication helper function
async function loadSavedCredentials() {
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

// Initialize FastMCP server
const server = new FastMCP({
  name: "Google Admin MCP",
  version: "1.0.0",
  capabilities: {
    stdio: true,
    http: false
  }
});

// Add list users tool
server.addTool({
  name: "listUsers",
  description: "List users from Google Admin Directory",
  parameters: z.object({
    domain: z.string().min(1, "Domain is required"),
  }),
  execute: async (args) => {
    try {
      const auth = await loadSavedCredentials();
      const service = google.admin({ version: 'directory_v1', auth });
      
      const response = await service.users.list({
        domain: args.domain,
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
  },
});

// Add create user tool
server.addTool({
  name: "addUser",
  description: "Create a new user in Google Admin Directory",
  parameters: z.object({
    primaryEmail: z.string().email("Invalid email format"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
  }),
  execute: async (args) => {
    try {
      const auth = await loadSavedCredentials();
      const service = google.admin({ version: 'directory_v1', auth });
      
      const password = generateSecurePassword();
      
      const response = await service.users.insert({
        requestBody: {
          primaryEmail: args.primaryEmail,
          password: password,
          name: {
            givenName: args.firstName,
            familyName: args.lastName,
            fullName: `${args.firstName} ${args.lastName}`,
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
  },
});

// Add suspend user tool
server.addTool({
  name: "suspendUser",
  description: "Suspend a user in Google Admin Directory",
  parameters: z.object({
    userKey: z.string().min(1, "User email or ID is required"),
  }),
  execute: async (args) => {
    try {
      const auth = await loadSavedCredentials();
      const service = google.admin({ version: 'directory_v1', auth });
      
      const response = await service.users.update({
        userKey: args.userKey,
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
  },
});

// Add unsuspend user tool
server.addTool({
  name: "unsuspendUser",
  description: "Unsuspend a user in Google Admin Directory",
  parameters: z.object({
    userKey: z.string().min(1, "User email or ID is required"),
  }),
  execute: async (args) => {
    try {
      const auth = await loadSavedCredentials();
      const service = google.admin({ version: 'directory_v1', auth });
      
      const response = await service.users.update({
        userKey: args.userKey,
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
  },
});

// Add get user tool
server.addTool({
  name: "getUser",
  description: "Get a specific user from Google Admin Directory",
  parameters: z.object({
    userKey: z.string().min(1, "User email or ID is required"),
  }),
  execute: async (args) => {
    try {
      const auth = await loadSavedCredentials();
      const service = google.admin({ version: 'directory_v1', auth });
      
      const response = await service.users.get({
        userKey: args.userKey,
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
  },
});

// Helper function to generate secure password
function generateSecurePassword() {
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

// Start the server
server.start({
  transportType: "stdio",
  stdio: {
    input: process.stdin,
    output: process.stdout
  }
}); 