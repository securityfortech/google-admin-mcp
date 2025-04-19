import { FastMCP } from "fastmcp";
import { z } from "zod";
import { listUsers, addUser, suspendUser, unsuspendUser, getUser } from "./google.js";

// Tool definitions
const tools = [
  {
    name: "listUsers",
    description: "List users from Google Admin Directory",
    parameters: z.object({
      domain: z.string().min(1, "Domain is required"),
    }),
    execute: (args) => listUsers(args.domain),
  },
  {
    name: "addUser",
    description: "Create a new user in Google Admin Directory",
    parameters: z.object({
      primaryEmail: z.string().email("Invalid email format"),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
    }),
    execute: (args) => addUser(args.primaryEmail, args.firstName, args.lastName),
  },
  {
    name: "suspendUser",
    description: "Suspend a user in Google Admin Directory",
    parameters: z.object({
      userKey: z.string().min(1, "User email or ID is required"),
    }),
    execute: (args) => suspendUser(args.userKey),
  },
  {
    name: "unsuspendUser",
    description: "Unsuspend a user in Google Admin Directory",
    parameters: z.object({
      userKey: z.string().min(1, "User email or ID is required"),
    }),
    execute: (args) => unsuspendUser(args.userKey),
  },
  {
    name: "getUser",
    description: "Get a specific user from Google Admin Directory",
    parameters: z.object({
      userKey: z.string().min(1, "User email or ID is required"),
    }),
    execute: (args) => getUser(args.userKey),
  },
];

// Initialize and start server
const server = new FastMCP({
  name: "Google Admin MCP",
  version: "1.0.0",
  capabilities: {
    stdio: true,
    http: false
  }
});

// Register all tools
tools.forEach(tool => server.addTool(tool));

// Start the server
server.start({
  transportType: "stdio",
  stdio: {
    input: process.stdin,
    output: process.stdout
  }
}); 