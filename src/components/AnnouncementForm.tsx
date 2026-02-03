import React, { useState, useEffect } from 'react';
import { createAnnouncement, updateAnnouncement } from '../services/announcementService';
import type { Announcement } from '../types';
import { toast } from 'react-hot-toast';

interface AnnouncementFormProps {
  announcement?: Announcement;
  onSubmit: () => void;
  onClose: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  announcement,
  onSubmit,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setImageUrl(announcement.image_url || '');
      setImagePreview(announcement.image_url || '');
    }
  }, [announcement]);

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (announcement) {
        await updateAnnouncement(announcement.id, title, content, true, imageUrl || undefined);
        toast.success('Announcement updated');
      } else {
        await createAnnouncement(title, content, imageUrl || undefined);
        toast.success('Announcement created');
      }
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Announcement message"
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Image URL
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => handleImageUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Paste an image URL. Recommended size: 400x300px or wider aspect ratio
        </p>
      </div>

      {imagePreview && (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 max-h-48">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImagePreview('')}
          />
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : announcement ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default AnnouncementForm;
