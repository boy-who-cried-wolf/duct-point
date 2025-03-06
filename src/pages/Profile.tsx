
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Loader2 } from 'lucide-react';
import { supabase, logError, logSuccess, logInfo } from '@/integrations/supabase/client';
import { useAuth } from '@/App';

const Profile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    jobTitle: '',
    company: '',
  });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // Get user initials for avatar fallback
  const userInitials = profileData.fullName
    ? profileData.fullName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
    : 'U';

  // Fetch user profile data from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsFetching(false);
        return;
      }

      try {
        logInfo('PROFILE: Fetching profile data', { userId: user.id });
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          logError('PROFILE: Error fetching profile', error);
          toast.error('Failed to load profile data');
        } else if (data) {
          logSuccess('PROFILE: Profile data loaded', data);
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
      } catch (error) {
        logError('PROFILE: Profile fetch error', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

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
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadLoading(true);
    
    try {
      logInfo('PROFILE: Uploading avatar', { fileName: file.name, fileSize: file.size });
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        logError('PROFILE: Avatar upload error', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;
      logSuccess('PROFILE: Avatar uploaded successfully', { publicUrl });
      
      // Update the user's profile with the avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        logError('PROFILE: Error updating profile with avatar URL', updateError);
        throw updateError;
      }

      setAvatarUrl(publicUrl);
      toast.success('Profile image updated');
      logSuccess('PROFILE: Profile image updated successfully', { publicUrl });
    } catch (error: any) {
      logError('PROFILE: Error uploading avatar', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploadLoading(false);
    }
  };

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
