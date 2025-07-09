import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useStorageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file, bucket, path, options = {}) => {
    try {
      setUploading(true);

      // Validate file
      if (!file) {
        throw new Error('No file selected');
      }

      // Check file size (default 5MB for avatars, 10MB for recipe images)
      const maxSize = bucket === 'avatars' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported. Please use JPEG, PNG, GIF, or WebP.');
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: options.upsert || true,
          ...options
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        data: {
          path: data.path,
          publicUrl,
          fullPath: data.fullPath
        }
      };

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Errore Upload",
        description: error.message,
        variant: "destructive",
      });
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (bucket, path) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Errore Eliminazione",
        description: error.message,
        variant: "destructive",
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  };

  const getPublicUrl = (bucket, path) => {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return publicUrl;
  };

  return {
    uploadFile,
    deleteFile,
    getPublicUrl,
    uploading
  };
};