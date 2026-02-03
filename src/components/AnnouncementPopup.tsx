import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? announcements.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === announcements.length - 1 ? 0 : prev + 1));
  };

  const currentAnnouncement = announcements[currentIndex];

  if (loading || !isOpen || announcements.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[85vh] flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
          {currentAnnouncement.image_url ? (
            <img
              src={currentAnnouncement.image_url}
              alt={currentAnnouncement.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/80 via-secondary/80 to-accent/80 backdrop-blur-sm">
              <div className="text-center text-white px-6">
                <div className="text-6xl mb-4">📢</div>
                <p className="text-lg font-semibold">{currentAnnouncement.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/2 flex flex-col p-6 md:p-8 relative">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close announcement"
          >
            <X size={24} className="text-gray-600" />
          </button>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 pr-8">
              {currentAnnouncement.title}
            </h2>

            <div className="text-gray-700 text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-6">
              {currentAnnouncement.content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-2">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-primary w-6'
                      : 'bg-gray-300 w-2 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to announcement ${index + 1}`}
                />
              ))}
            </div>

            {announcements.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  className="p-2 text-primary hover:bg-primary hover:bg-opacity-10 rounded-full transition-colors"
                  aria-label="Previous announcement"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 text-primary hover:bg-primary hover:bg-opacity-10 rounded-full transition-colors"
                  aria-label="Next announcement"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
