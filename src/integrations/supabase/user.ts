import { supabase } from "./client";

export type UserRole = 'user' | 'admin' | 'super_admin';
type UserPlatformRole = {
    user_id: string;
    role: UserRole;
};

// Function to fetch the user's session and role
export async function getUserRole(): Promise<UserRole | null> {
    try {
        // Fetch the user's session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error fetching session:', error);
            return null;
        }

        if (!session) {
            console.log('No active session.');
            return null;
        }

        const user_id = session.user.id; // Get the user's UUID

        // Fetch the user's role from the user_platform_roles table
        const { data: roles, error: roleError } = await supabase
            .from('user_platform_roles')
            .select('role')
            .eq('user_id', user_id)
            .returns<UserPlatformRole[]>(); // Specify the return type

        if (roleError) {
            console.error('Error fetching user role:', roleError);
            return null;
        }

        if (roles.length === 0) {
            console.log('No roles found for this user.');
            return null;
        }

        const user_role = roles[0].role; // TypeScript knows this is of type UserRole
        console.log('User role:', user_role);

        return user_role;
    } catch (err) {
        console.error('Unexpected error:', err);
        return null;
    }
}