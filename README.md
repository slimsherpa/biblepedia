# BiblePedia - Scholarly Bible Wiki

BiblePedia is a modern, scholarly Bible wiki platform where anyone can view the Bible and expert commentary, but only verified scholars can contribute to and debate the interpretation of specific verses.

## Features

- **Four-Column Layout**: Intuitive navigation through books, chapters, verses, and scholarly commentary
- **Multiple Bible Versions**: Support for various Bible translations through integration with the Bible API
- **Scholar-Only Contributions**: Verified experts can contribute and debate interpretations
- **Modern UI**: Clean, responsive design with smooth animations and transitions
- **Firebase Integration**: Authentication, database, and storage for scholarly discussions

## Technology Stack

- **Frontend**: Next.js 14 App Router, React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **API**: Integration with [Bible API](https://github.com/wldeh/bible-api) for Bible text

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account and project

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/biblepedia.git
   cd biblepedia
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app`: Next.js App Router pages and API routes
- `src/app/components`: React components for the UI
- `src/lib/api`: API integration services
- `src/lib/firebase`: Firebase configuration and utilities
- `src/lib/hooks`: Custom React hooks
- `src/lib/contexts`: React context providers

## Scholar Verification Process

1. Scholars sign up with Google Authentication
2. They provide their credentials and areas of expertise
3. Admins review and approve scholar applications
4. Approved scholars can contribute to verse commentaries and discussions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Bible API](https://github.com/wldeh/bible-api) for providing the Bible text data
- All the scholars who contribute their expertise to this platform