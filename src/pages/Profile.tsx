
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    jobTitle: '',
    company: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const userInitials = profileData.fullName
    ? profileData.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
    : 'U';

  useEffect(() => {
    console.log("🧑‍💼 Profile - Auth state:", { isAuthenticated, authLoading, userId: user?.id });
    
    // Only fetch when we're sure we have a user
    if (authLoading) {
      console.log("⏳ Profile - Waiting for auth to complete");
      return;
    }
    
    if (!isAuthenticated || !user) {
      console.log("⚠️ Profile - No authenticated user");
      setIsFetching(false);
      setError("Please log in to view your profile");
      return;
    }

    const fetchProfile = async () => {
      console.log("🔍 Profile - Fetching profile data for user:", user.id);
      setIsFetching(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('❌ Error fetching profile:', error);
          setError('Failed to load profile data');
          toast.error('Failed to load profile data');
        } else if (data) {
          console.log('✅ Profile data loaded:', data);
          setProfileData({
            fullName: data.full_name || '',
            email: data.email || user.email || '',
            jobTitle: data.job_title || '',
            company: data.company || '',
          });
          
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        }
      } catch (error: any) {
        console.error('❌ Profile fetch error:', error);
        setError(error.message || 'Failed to load profile data');
        toast.error('Failed to load profile data');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [user, isAuthenticated, authLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.fullName,
          email: profileData.email,
          job_title: profileData.jobTitle,
          company: profileData.company,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
      setError('Failed to update profile: ' + error.message);
      console.error('❌ Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadLoading(true);
    setError(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success('Profile image updated');
    } catch (error: any) {
      console.error('❌ Error uploading avatar:', error);
      setError('Failed to upload image: ' + error.message);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // Show error if user is not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium mb-2">Authentication Required</p>
          <p className="text-muted-foreground">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching profile
  if (isFetching) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-2 card-hover overflow-hidden">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Update your profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl} alt={profileData.fullName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col items-center">
              <Label 
                htmlFor="avatar" 
                className={`cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-medium underline-offset-4 hover:underline text-muted-foreground ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload new picture
                  </>
                )}
              </Label>
              <Input 
                id="avatar" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange}
                disabled={uploadLoading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG or GIF. 1MB max.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 card-hover overflow-hidden">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    placeholder="Your email"
                    disabled={!user?.email}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    value={profileData.jobTitle}
                    onChange={handleChange}
                    placeholder="Your job title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={profileData.company}
                    onChange={handleChange}
                    placeholder="Your company"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
