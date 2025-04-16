# DUCT Points Platform

A comprehensive rewards and points management system built with Next.js, Supabase, and TypeScript. This platform enables organizations to track, manage, and reward user engagement through a points-based system.

## Features

- **User Authentication**: Secure authentication system using Supabase Auth
- **Role-Based Access Control**: Granular access control with user, admin, and super-admin roles
- **Points Management**: Track and manage user points across different activities
- **Organization Management**: Multi-organization support with hierarchical structure
- **Milestone System**: Configurable milestones and rewards based on point accumulation
- **Real-time Updates**: Live updates using Supabase's real-time capabilities
- **Responsive Design**: Modern UI built with Tailwind CSS and Shadcn UI components

## Tech Stack

- **Frontend**: Next.js, TypeScript, React
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query
- **Real-time**: Supabase Realtime

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project
- Git

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/boy-who-cried-wolf/duct-point.git
   cd duct-point
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   - Copy the `.env.example` file to `.env.local`
   ```bash
   cp .env.example .env.local
   ```
   - Update the environment variables with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   - Run the SQL migrations in your Supabase project
   - The migration files are located in `supabase/migrations`

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context providers
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # Third-party integrations
│   ├── lib/           # Utility functions and helpers
│   ├── pages/         # Next.js pages
│   └── styles/        # Global styles and Tailwind config
├── public/            # Static assets
├── supabase/         # Supabase configurations and migrations
└── types/            # TypeScript type definitions
```

## Key Features Documentation

### Points System
- Points are awarded based on user activities and achievements
- Configurable point values for different actions
- Real-time point tracking and updates

### Role Management
- Super Admin: Full system access and configuration
- Admin: Organization management and user administration
- User: Basic platform interaction and point earning

### Organizations
- Multi-organization support
- Organization-specific settings and configurations
- Member management and role assignment

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
