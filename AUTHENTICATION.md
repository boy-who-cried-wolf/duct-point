# Authentication and Authorization System

This document outlines the authentication, authorization, and tier system implementation for the Duct Points application.

## Authentication (Login/Logout)

The authentication system is built using Supabase Auth with the following features:

- **User Authentication**: Email/password authentication through Supabase
- **Session Management**: Handled through the AuthContext React context provider
- **Automatic Profile Creation**: New users have profiles created automatically on signup
- **Audit Logging**: User actions (login, logout, profile changes) are recorded in audit_logs
- **Error Handling**: Comprehensive error handling with user feedback via toast notifications

### Key Files:

- `src/contexts/AuthContext.tsx`: Context provider for authentication
- `src/integrations/supabase/client.ts`: Supabase client configuration

## Row-Level Security (RLS)

Security is enforced using Supabase's Row-Level Security policies to ensure users can only access their own data:

- **Profiles**: Users can only read/update their own profiles
- **Redeemed Perks**: Users can only see/redeem their own perks
- **Course Enrollments**: Users can only view/manage their own enrollments
- **Storage Buckets**: Users can only access their own avatar images

Staff and admin users have elevated permissions for managing data across the application.

### Key Files:

- `supabase/migrations/20231201_rls_policies.sql`: SQL file defining all RLS policies

## Tier & Rewards System

The tier system manages user progress, tiers, and reward milestones:

- **Default Tiers**: The system includes default tiers (Bronze, Silver, Gold) if none exist in the database
- **Milestones**: Each tier has multiple milestones users can achieve based on points
- **Real-time Updates**: Point and perk changes are updated in real-time using Supabase subscriptions
- **Redemption System**: Users can redeem rewards when they reach milestones

### Key Files:

- `src/hooks/useTierData.ts`: Hook managing tier data, milestones, and redemptions
- `supabase/migrations/20231202_default_tiers.sql`: SQL file setting up default tiers and milestones

## User Profile Management

The application automatically manages user profiles:

- **Profile Creation**: Profiles are created automatically when users first sign up
- **Points Tracking**: Tracks user points and calculates appropriate tier
- **Real-time Updates**: Profile changes trigger UI updates via subscriptions

## Performance Optimizations

Several optimizations have been implemented:

- **Batch Loading**: Data is loaded efficiently using Promise.all for parallel requests
- **Debounced Updates**: Updates are throttled to prevent excessive database calls
- **Caching**: Frequently accessed data is cached to reduce database queries
- **Fallback Data**: Default tiers are provided as fallback when database tables are empty

## Usage

To authenticate a user:

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const { login } = useAuth();
  
  const handleSubmit = async (email, password) => {
    try {
      await login(email, password);
      // User is now logged in
    } catch (error) {
      // Handle login error
    }
  };
}
```

To access tier data:

```typescript
import { useTierData } from '@/hooks/useTierData';

function TierInfo() {
  const { 
    currentTier, 
    totalPoints, 
    milestones, 
    redeemPerk 
  } = useTierData();
  
  // Display tier info and milestones
  // Allow users to redeem perks
}
``` 