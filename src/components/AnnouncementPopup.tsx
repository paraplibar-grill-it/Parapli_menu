import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getActiveAnnouncements } from '../services/announcementService';
import type { Announcement } from '../types';

interface AnnouncementPopupProps {
  onClose?: () => void;
}

const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({ onClose }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const data = await getActiveAnnouncements();
        setAnnouncements(data);
        if (data.length > 0) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const currentAnnouncement = announcements[currentIndex];

  if (loading || !isOpen || announcements.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b border-blue-200">
          <h2 className="text-xl md:text-2xl font-bold text-white">{currentAnnouncement.title}</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-blue-700 p-2 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close announcement"
          >
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-6 md:py-8">
          <div className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {currentAnnouncement.content}
          </div>
        </div>

        {announcements.length > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-center gap-2">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                aria-label={`Go to announcement ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementPopup;
