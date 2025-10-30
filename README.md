# All Sports Live 🏆

A modern, high-performance sports management platform built with React, Vite, and Supabase. Perfect for college festivals, sports events, and tournaments with real-time scoring and comprehensive analytics.

## ✨ Features

- **Real-time Live Scoring** - Score matches instantly with live updates
- **Tournament Management** - Create and manage complete tournaments
- **Quick Match Creation** - Start scoring immediately without setup
- **Multi-sport Support** - Cricket, Football, Basketball, Tennis, and more
- **Player Statistics** - Comprehensive analytics and performance tracking
- **Responsive Design** - Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/om-pandey-new/AllSportsLive.git
cd AllSportsLive/aslsports_live
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
# Add your Supabase credentials
```

4. Start the development server

```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite 7
- **Styling**: TailwindCSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: Context API with custom hooks
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── Auth.jsx        # Authentication
│   ├── Dashboard.jsx   # User dashboard
│   ├── Homepage.jsx    # Landing page
│   ├── LiveScoring.jsx # Real-time scoring
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── hooks/              # Custom hooks
│   ├── useDataCache.js
│   └── useRealtimeSubscription.js
├── assets/             # Static assets
└── main.jsx           # App entry point

database/               # SQL schemas and migrations
docs/                  # Documentation
scripts/               # Utility scripts
```

## 🎯 Key Components

### Core Features

- **Homepage** - Modern landing page with feature showcase
- **QuickMatchCreator** - Instant match setup
- **LiveScoring** - Real-time match scoring interface
- **Dashboard** - User management and match overview
- **TournamentPage** - Tournament management

### Authentication & Users

- **Auth** - Login/signup with Supabase Auth
- **RoleSelection** - Player/Organizer role assignment
- **AdminPanel** - Tournament organizer tools

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run clean    # Clean build artifacts
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The `dist` folder contains the production build ready for deployment.

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

## 🏏 Sports Supported

- Cricket (Runs, Wickets, Overs)
- Football (Goals, Cards)
- Basketball (Points, Fouls)
- Tennis (Sets, Games)
- Volleyball (Sets, Points)
- Badminton (Sets, Points)

## 📱 Screenshots

[Add screenshots of key features here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue on GitHub
- Contact: [your-email@example.com]

---

Made with ❤️ for sports communities worldwide
