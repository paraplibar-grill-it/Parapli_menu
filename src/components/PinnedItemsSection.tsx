import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getPinnedMenuItems } from '../services/menuService';
import MenuItemCard from './MenuItemCard';
import type { MenuItem } from '../types';
import { useAuth } from '../context/AuthContext';

const PinnedItemsSection: React.FC = () => {
  const [pinnedItems, setPinnedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPinnedItems = async () => {
      try {
        const items = await getPinnedMenuItems();
        setPinnedItems(items);
      } catch (error) {
        console.error('Error fetching pinned items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPinnedItems();
  }, []);

  if (loading || pinnedItems.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-1 w-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"></div>
          <div className="flex items-center gap-2">
            <Star size={28} className="text-emerald-600 fill-emerald-600" />
            <h2 className="text-3xl font-bold text-emerald-700">Disponible Maintenant</h2>
          </div>
          <div className="h-1 w-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"></div>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Découvrez nos plats disponibles en ce moment
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pinnedItems.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            isAdmin={!!user}
          />
        ))}
      </div>
    </section>
  );
};

export default PinnedItemsSection;
