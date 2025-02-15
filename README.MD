# Wind Mail

A modern, feature-rich email campaign management system built with Next.js 13+. Wind Mail provides a beautiful, intuitive interface for managing email campaigns, recipient lists, and tracking email delivery status in real-time.

![Wind Mail Dashboard](https://images.unsplash.com/photo-1557568192-2fafc8b5bdc9?auto=format&fit=crop&q=80&w=2940)

## Features

### 📧 Email Campaign Management
- Create and send email campaigns to multiple recipients
- Support for both plain text and HTML emails
- Campaign scheduling functionality
- Batch sending with progress tracking
- Save campaigns as drafts
- Real-time sending status updates

### 👥 Recipient Management
- Import/export recipient lists via CSV
- Manage recipient details (name, email)
- Duplicate detection
- Bulk recipient management

### 📊 Analytics & Logging
- Real-time delivery status tracking
- Detailed email logs with success/failure status
- Campaign performance metrics
- 24-hour sending activity chart

### ⚙️ SMTP Configuration
- Support for major email providers (Gmail, Outlook, etc.)
- Secure credential storage
- SSL/TLS support
- Custom SMTP server configuration

### 🎨 User Interface
- Modern, responsive design
- Dark/light theme support
- Real-time updates
- Intuitive navigation
- Progress indicators for long-running operations

### 💾 Data Management
- Export/import system configuration
- Backup and restore functionality
- Email log management
- Draft management

## Getting Started

### Prerequisites
- Node.js 16.8 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wind-mail.git
cd wind-mail
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### SMTP Setup

1. Navigate to the Settings page
2. Configure your SMTP server details:
   - SMTP Host
   - Port
   - Username
   - Password
   - From Email
   - From Name
3. Choose SSL/TLS settings
4. Save your configuration

### Importing Recipients

1. Go to the Recipients page
2. Click "Import CSV"
3. Use a CSV file with the following format:
```csv
Email,Name
user@example.com,John Doe
```

## Usage

### Creating a Campaign

1. Enter campaign details:
   - Campaign Name
   - Email Subject
   - Content (HTML or plain text)
2. Choose between immediate sending or scheduling
3. Click "Send Now" or "Schedule Campaign"

### Managing Drafts

1. Save campaigns as drafts using "Save as Draft"
2. Access drafts from the Drafts page
3. Edit or delete drafts as needed

### Monitoring Delivery

1. View real-time sending progress
2. Check email logs for delivery status
3. Monitor the 24-hour activity chart
4. Export logs for analysis

## Backup and Restore

### Creating a Backup

1. Go to Settings
2. Click "Export Backup"
3. Save the JSON file

### Restoring from Backup

1. Go to Settings
2. Click "Import Backup"
3. Select your backup file
4. Wait for confirmation

## Development

### Tech Stack
- Next.js 13+
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- Node.js
- Nodemailer

### Project Structure
```
wind-mail/
├── app/                # Next.js app directory
│   ├── api/           # API routes
│   ├── compose/       # Campaign composition
│   ├── drafts/        # Draft management
│   ├── recipients/    # Recipient management
│   └── settings/      # SMTP configuration
├── components/        # React components
├── lib/              # Utility functions
└── public/           # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Nodemailer](https://nodemailer.com/)
- [Lucide Icons](https://lucide.dev/)