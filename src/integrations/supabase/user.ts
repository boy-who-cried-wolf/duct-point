import { supabase } from "./client";
import type { Database } from "./types";

export type UserRole = Database['public']['Enums']['app_role'];

export type UserPlatformRole = {
    user_id: string;
    role: UserRole;
};

// Function to fetch the user's session and role
export async function getUserRole(): Promise<UserRole | null> {
    try {
        console.log('getUserRole: Starting to fetch user role...');
        
        // Verify supabase client
        if (!supabase) {
            console.error('getUserRole: Supabase client is not initialized');
            return null;
        }

        // Verify auth module
        if (!supabase.auth) {
            console.error('getUserRole: Supabase auth module is not initialized');
            return null;
        }

        console.log('getUserRole: Supabase client verified, attempting to get session...');
        
        // Fetch the user's session with timeout
        let sessionResult;
        try {
            sessionResult = await Promise.race([
                supabase.auth.getSession(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
                )
            ]);
        } catch (sessionError) {
            console.error('getUserRole: Error during session fetch:', sessionError);
            return null;
        }

        console.log('getUserRole: Session result received:', sessionResult);

        if (sessionResult.error) {
            console.error('getUserRole: Error fetching session:', sessionResult.error);
            return null;
        }

        const session = sessionResult.data?.session;
        if (!session) {
            console.log('getUserRole: No active session.');
            return null;
        }

        const user_id = session.user.id;
        console.log('getUserRole: Found user ID:', user_id);

        // Fetch the user's role from the user_platform_roles table
        console.log('getUserRole: Attempting to fetch role from user_platform_roles table...');
        console.log('getUserRole: Query parameters:', { user_id });
        
        const roleResult = await supabase
            .from('user_platform_roles')
            .select('role')
            .eq('user_id', user_id)
            .maybeSingle();
        
        console.log('getUserRole: Role query result:', roleResult);

        if (roleResult.error) {
            console.error('getUserRole: Error fetching user role:', roleResult.error);
            return null;
        }

        if (!roleResult.data) {
            console.log('getUserRole: No roles found for this user.');
            return null;
        }

        console.log('getUserRole: Raw role data:', roleResult.data);
        const user_role = roleResult.data.role as UserRole;
        console.log('getUserRole: Successfully fetched role:', user_role);

        return user_role;
    } catch (err) {
        console.error('getUserRole: Unexpected error:', err);
        if (err instanceof Error) {
            console.error('getUserRole: Error details:', err.message);
            console.error('getUserRole: Error stack:', err.stack);
        }
        return null;
    }
}