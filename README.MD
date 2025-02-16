<div align="center">
<img src="https://raw.githubusercontent.com/MinhxThanh/Wind-Mail/refs/heads/main/public/images/image_background.png" alt="Wind Mail Background" style="max-height: 400px; width: auto;"/>
</div>
  <div align="center">

# Wind Mail

  
<p align="center">
  
  [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
  <a href="https://w404.net/">
    <img src="https://img.shields.io/badge/by-W404.NET-purple.svg" alt="W404.NET">
  </a>
<img src="https://api.visitorbadge.io/api/VisitorHit?user=MinhxThanh&repo=Wind-Mail&countColor=%237B1E7A" style="max-height: 20px " />
</p>
      


</div>

Wind Mail is a modern, feature-rich email campaign management system. It offers an intuitive, responsive interface for managing email campaigns, recipient lists, and tracking real-time email delivery performance. Key features include support for plain text and HTML emails, campaign scheduling with batch sending, detailed analytics, and secure integration with major email providers. Additional capabilities include recipient management, CSV import/export, duplicate detection, and robust backup and restore functionality. Designed for ease of use, Wind Mail supports dark/light themes, progress indicators, and seamless navigation, making it a top choice for email marketing professionals.


## Features

### 📧 Email Campaign Management
- Create and send email campaigns to multiple recipients
- Support for both plain text and HTML emails
- Campaign scheduling functionality
- Batch sending with progress tracking
- Save campaigns as drafts
- Real-time sending status updates
- File attachments support (up to 10MB per file)

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
- Node.js 20.x or later
- npm or yarn package manager
- Docker (optional)

### Installation

#### Local Development
1. Clone the repository:
```bash
git clone https://github.com/MinhxThanh/Wind-Mail.git
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

#### Using Docker

1. Development Environment:
```bash
# Start the development environment
docker-compose up dev

# Stop the development environment
docker-compose down
```

2. Production Environment:
```bash
# Start the production environment
docker-compose up prod -d

# Stop the production environment
docker-compose down
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
or

```csv
Email
user@example.com
```

## Usage

### Creating a Campaign

1. Enter campaign details:
   - Campaign Name
   - Email Subject
   - Content (HTML or plain text)
   - Attachments (optional)
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
- Docker

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

### Docker Configuration

The project includes Docker support with separate configurations for development and production:

- `Dockerfile.dev`: Development environment with hot-reloading
- `Dockerfile`: Production-ready build
- `docker-compose.yml`: Orchestration for both environments

Key features:
- Volume mounting for development
- Optimized production builds
- Environment variable support
- Automatic container restart
- Port mapping (3000)

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
