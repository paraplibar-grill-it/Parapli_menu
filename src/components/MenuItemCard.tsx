import React from 'react';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';
import type { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  isAdmin = false
}) => {
  const [imageError, setImageError] = React.useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item);
    toast.success(`${item.name} ajouté au panier !`);
  };
  
  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'popular': 'bg-gradient-to-r from-rose-50 to-red-50 text-rose-700 border-rose-200',
      'featured': 'bg-gradient-to-r from-fuchsia-50 to-pink-50 text-fuchsia-700 border-fuchsia-200',
      'new': 'bg-gradient-to-r from-emerald-50 to-red-50 text-emerald-700 border-emerald-200',
      'special': 'bg-gradient-to-r from-violet-50 to-red-50 text-violet-700 border-violet-200',
      'best-seller': 'bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 border-pink-200',
      'special price': 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border-red-200',
      'up to 50% discount': 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-200',
      'special 15% discount': 'bg-gradient-to-r from-amber-50 to-red-50 text-amber-700 border-amber-200',
      'big offer': 'bg-gradient-to-r from-purple-50 to-red-50 text-purple-700 border-purple-200'
    };
    return colors[tag.toLowerCase()] || 'bg-gradient-to-r from-gray-50 to-red-50 text-gray-700 border-gray-200';
  };

  const isValidImageUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const shouldShowImage = item.image_url && isValidImageUrl(item.image_url) && !imageError;

  return (
    <div className="bg-white border-2 border-secondary/20 rounded-xl p-4 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-secondary">
      <div className="flex gap-4 mb-4">
        {shouldShowImage && (
          <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-primary">{item.name}</h3>
            <div className="text-right">
              {item.is_special_offer && item.original_price ? (
                <div className="flex flex-col items-end">
                  <span className="text-sm text-gray-500 line-through">G{item.original_price.toFixed(2)}</span>
                  <span className="font-bold text-red-600 text-lg">G{item.price.toFixed(2)}</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">SPECIAL</span>
                </div>
              ) : (
                <span className="font-bold text-accent">G{item.price.toFixed(2)}</span>
              )}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
          
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`text-xs px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-sm ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-auto">
        {isAdmin ? (
          <>
            <button
              onClick={onEdit}
              className="text-sm px-4 py-1.5 border-2 border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-sm px-4 py-1.5 border-2 border-accent text-accent rounded-lg hover:bg-accent/5 transition-colors"
            >
              Delete
            </button>
          </>
        ) : (
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            <span className="font-semibold"></span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;