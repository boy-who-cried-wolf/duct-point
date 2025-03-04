
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileAvatarProps {
  user: User | null;
  url: string | null;
  size?: number;
  onUpload: (url: string) => void;
}

export default function ProfileAvatar({ 
  user, 
  url, 
  size = 150, 
  onUpload 
}: ProfileAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (url) {
      setAvatarUrl(url);
    }
  }, [url]);

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload the file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      setAvatarUrl(publicUrl);
      toast({
        title: 'Avatar uploaded successfully',
        description: 'Your profile image has been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Avatar upload failed',
        description: error.message || 'An error occurred uploading your avatar.',
      });
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {avatarUrl ? (
        <Avatar className="w-32 h-32 border-2 border-primary">
          <AvatarImage src={avatarUrl} alt="Profile" className="object-cover" />
          <AvatarFallback className="text-2xl">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="w-32 h-32 border-2 border-primary">
          <AvatarFallback className="text-2xl">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex items-center">
        <Label
          htmlFor="avatar-upload"
          className="cursor-pointer text-primary hover:underline flex items-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Change avatar'
          )}
        </Label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}
