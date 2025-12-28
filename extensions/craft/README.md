# Craft

Integrate [Craft.do](https://www.craft.do) with Raycast for seamless document management, task tracking, and daily notes access.

## Features

- **Search Documents** – Quickly find any document across your Craft space
- **Daily Notes** – View, search, and add content to your daily notes
- **Task Management** – Create, view, and manage tasks with support for scheduling and deadlines
- **Browse Folders** – Navigate your folder structure and organize documents
- **Create Documents** – Create new documents from scratch, clipboard, or selected text
- **AI Tools** – MCP-compatible tools for AI assistants to interact with your Craft workspace

## Setup

This extension requires API access to your Craft space. You need to create **two separate API connections** in Craft:

1. **Documents API** – For accessing regular documents and folders
2. **Daily Notes & Tasks API** – For accessing daily notes and task management

### 1. Create the Documents API Connection

1. Open **Craft** on your device
2. Click the **Imagine** tab in the sidebar
3. Click **"Add Your First API Connection"** (or **"+"** if you already have connections)
4. Choose one of:
   - **Connect Selected Documents** – Select specific documents to expose via the API
   - **Connect All Documents** – Give access to every document in the space
5. Configure the connection with a name (e.g., "Raycast Documents")
6. Copy the API URL shown at the top of the configuration screen

### 2. Create the Daily Notes & Tasks API Connection

1. Click **"+"** to add another API connection
2. Choose **Connect Daily Notes & Tasks**
3. Configure the connection with a name (e.g., "Raycast Daily Notes")
4. Copy the API URL shown at the top of the configuration screen

Each connection will provide a URL in this format:

```
https://connect.craft.do/links/YOUR_LINK_ID/api/v1
```

### 3. (Optional) Create API Keys for Enhanced Security

By default, API connections use URL-based access. For enhanced security, you can restrict access using API keys:

1. In your API connection settings, change **Access Mode** to **API Key**
2. Click the **"+"** button next to **API Keys** to create a new key
3. Copy the generated API key (you won't be able to see it again)
4. Enter the API key in the Raycast extension preferences

You can create separate API keys for each connection (Documents and Daily Notes & Tasks).

### 4. Configure the Extension in Raycast

When you first run any Craft command in Raycast, you'll be prompted to enter:

- **Documents API URL** – The API URL for your documents connection
- **Documents API Key** – (Optional) API key if Access Mode is set to API Key
- **Daily Notes & Tasks API URL** – The API URL for your daily notes and tasks connection
- **Daily Notes & Tasks API Key** – (Optional) API key if Access Mode is set to API Key

You can also configure these later in Raycast Preferences → Extensions → Craft.

## Commands

| Command | Description |
|---------|-------------|
| Search Documents | Search all documents in your Craft space |
| Daily Notes | View and navigate your daily notes |
| Search Daily Notes | Search content within daily notes |
| Add to Daily Note | Quickly add content to today's daily note |
| Tasks | View and manage all tasks |
| Today's Tasks | View today's tasks grouped by location |
| Upcoming Tasks | View scheduled and upcoming tasks |
| Inbox Tasks | View tasks in your inbox |
| Task Logbook | View completed and canceled tasks |
| Create Task | Create a new task in Craft |
| Create Document | Create a new document in Craft |
| Browse Folders | Browse, create, and manage folders |
| Manage Spaces | Add, edit, and switch between Craft spaces |
| Recently Deleted | View and permanently delete trashed documents |

## AI Tools (MCP)

This extension provides MCP-compatible tools for AI assistants, enabling them to:

- Search and retrieve documents and blocks
- Create, update, and delete documents
- Manage tasks and daily notes
- Work with collections (structured data tables)
- Navigate folder structures

## Multiple Spaces

You can connect multiple Craft spaces using the **Manage Spaces** command. Each space requires its own Documents API URL and Daily Notes & Tasks API URL.

## Links

- [Craft API Documentation](https://www.craft.do/imagine/guide/api/api)
- [Craft Help Center](https://support.craft.do/)
