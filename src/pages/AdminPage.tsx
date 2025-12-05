import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { createMenuItem, updateMenuItem, deleteMenuItem, createCategory, updateCategory, deleteCategory } from '../services/menuService';
import { reorderCategories, reorderMenuItems } from '../services/menuService';
import { createNewsEvent, updateNewsEvent, deleteNewsEvent, getNewsEvents } from '../services/newsService';
import { useAuth } from '../context/AuthContext';
import MenuGrid from '../components/MenuGrid';
import MenuItemDragList from '../components/MenuItemDragList';
import CategoryNavigation from '../components/CategoryNavigation';
import SpecialOffersSection from '../components/SpecialOffersSection';
import MenuItemForm from '../components/MenuItemForm';
import CategoryForm from '../components/CategoryForm';
import CategoryDragList from '../components/CategoryDragList';
import NewsEventForm from '../components/NewsEventForm';
import MenuQRCode from '../components/MenuQRCode';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Plus, Bell, ArrowUpDown } from 'lucide-react';
import type { MenuItem, MenuItemInput, Category, CategoryInput, NewsEvent, NewsEventInput } from '../types';
import toast, { Toaster } from 'react-hot-toast';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { menuItems, categories, refreshMenu } = useMenu();
  
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isNewsEventModalOpen, setIsNewsEventModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReorderingMenuItems, setIsReorderingMenuItems] = useState(false);
  const [deleteType, setDeleteType] = useState<'menuItem' | 'category' | 'newsEvent'>('menuItem');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedNewsEventId, setSelectedNewsEventId] = useState<string | null>(null);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);
  
  React.useEffect(() => {
    const fetchNewsEvents = async () => {
      try {
        const events = await getNewsEvents();
        setNewsEvents(events);
      } catch (error) {
        console.error('Error fetching news/events:', error);
        toast.error('Failed to load news and events');
      }
    };
    
    fetchNewsEvents();
  }, []);
  
  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }
  
  if (!user) return null;
  
  const selectedMenuItem = selectedItemId 
    ? menuItems.find(item => item.id === selectedItemId)
    : undefined;
    
  const selectedCategory = selectedCategoryId
    ? categories.find(cat => cat.id === selectedCategoryId)
    : undefined;
    
  const selectedNewsEvent = selectedNewsEventId
    ? newsEvents.find(event => event.id === selectedNewsEventId)
    : undefined;
  
  const menuUrl = window.location.origin;
  
  // Menu Item Handlers
  const handleEditMenuItem = (id: string) => {
    setSelectedItemId(id);
    setIsMenuItemModalOpen(true);
  };
  
  const handleAddMenuItem = () => {
    setSelectedItemId(null);
    setIsMenuItemModalOpen(true);
  };
  
  const handleDeleteMenuItem = (id: string) => {
    setSelectedItemId(id);
    setDeleteType('menuItem');
    setIsDeleteModalOpen(true);
  };
  
  const handleMenuItemSubmit = async (data: MenuItemInput) => {
    try {
      if (selectedItemId) {
        await updateMenuItem(selectedItemId, data);
        toast.success('Menu item updated successfully');
      } else {
        await createMenuItem(data);
        toast.success('Menu item created successfully');
      }
      
      await refreshMenu();
      setIsMenuItemModalOpen(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    }
  };
  
  // Category Handlers
  const handleEditCategory = (id: string) => {
    setSelectedCategoryId(id);
    setIsCategoryModalOpen(true);
  };
  
  const handleAddCategory = () => {
    setSelectedCategoryId(null);
    setIsCategoryModalOpen(true);
  };
  
  const handleDeleteCategory = (id: string) => {
    setSelectedCategoryId(id);
    setDeleteType('category');
    setIsDeleteModalOpen(true);
  };
  
  const handleCategorySubmit = async (data: CategoryInput) => {
    try {
      if (selectedCategoryId) {
        await updateCategory(selectedCategoryId, data);
        toast.success('Category updated successfully');
      } else {
        await createCategory(data);
        toast.success('Category created successfully');
      }
      
      await refreshMenu();
      setIsCategoryModalOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };
  
  const handleCategoryReorder = async (newOrder: Category[]) => {
    try {
      const categoryIds = newOrder.map(cat => cat.id);
      await reorderCategories(categoryIds);
      toast.success('Categories reordered successfully');
      await refreshMenu();
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Failed to reorder categories');
    }
  };

  const handleMenuItemReorder = async (newOrder: MenuItem[]) => {
    try {
      const itemIds = newOrder.map(item => item.id);
      await reorderMenuItems(itemIds);
      toast.success('Menu items reordered successfully');
      await refreshMenu();
      setIsReorderingMenuItems(false);
    } catch (error) {
      console.error('Error reordering menu items:', error);
      toast.error('Failed to reorder menu items');
    }
  };
  
  // News/Event Handlers
  const handleEditNewsEvent = (id: string) => {
    setSelectedNewsEventId(id);
    setIsNewsEventModalOpen(true);
  };
  
  const handleAddNewsEvent = () => {
    setSelectedNewsEventId(null);
    setIsNewsEventModalOpen(true);
  };
  
  const handleDeleteNewsEvent = (id: string) => {
    setSelectedNewsEventId(id);
    setDeleteType('newsEvent');
    setIsDeleteModalOpen(true);
  };
  
  const handleNewsEventSubmit = async (data: NewsEventInput) => {
    try {
      if (selectedNewsEventId) {
        await updateNewsEvent(selectedNewsEventId, data);
        toast.success('News/Event updated successfully');
      } else {
        await createNewsEvent(data);
        toast.success('News/Event created successfully');
      }
      
      const updatedEvents = await getNewsEvents();
      setNewsEvents(updatedEvents);
      setIsNewsEventModalOpen(false);
    } catch (error) {
      console.error('Error saving news/event:', error);
      toast.error('Failed to save news/event');
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      if (deleteType === 'menuItem' && selectedItemId) {
        await deleteMenuItem(selectedItemId);
        toast.success('Menu item deleted successfully');
        await refreshMenu();
      } else if (deleteType === 'category' && selectedCategoryId) {
        await deleteCategory(selectedCategoryId);
        toast.success('Category deleted successfully');
        await refreshMenu();
      } else if (deleteType === 'newsEvent' && selectedNewsEventId) {
        await deleteNewsEvent(selectedNewsEventId);
        toast.success('News/Event deleted successfully');
        const updatedEvents = await getNewsEvents();
        setNewsEvents(updatedEvents);
      }
      
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(`Failed to delete ${deleteType}`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      <section className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your menu items, categories, and news/events</p>
      </section>
      
      {/* News/Events Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">News & Events</h2>
          <Button onClick={handleAddNewsEvent}>
            <Bell size={16} className="mr-1" />
            Add News/Event
          </Button>
        </div>
        
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Title</th>
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Created</th>
                <th className="py-2 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {newsEvents.map((event) => (
                <tr key={event.id} className="border-b">
                  <td className="py-2 px-4">{event.title}</td>
                  <td className="py-2 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.type === 'event' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {event.type === 'event' ? '🎉 Event' : '📢 News'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {new Date(event.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEditNewsEvent(event.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteNewsEvent(event.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {newsEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No news or events found. Add your first announcement!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Categories</h2>
          <Button size="sm" onClick={handleAddCategory}>
            <Plus size={16} className="mr-1" />
            Add Category
          </Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop categories to reorder them. The order will be reflected in the menu navigation.
          </p>
          <CategoryDragList
            categories={categories}
            onReorder={handleCategoryReorder}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
      </section>
      
      {/* Special Offers Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Special Offers</h2>
          <p className="text-sm text-gray-600">
            Items marked as special offers will appear in the special offers section
          </p>
        </div>
        
        <SpecialOffersSection
          onEditItem={handleEditMenuItem}
          onDeleteItem={handleDeleteMenuItem}
          isAdmin={true}
        />
      </section>
      
      {/* Menu Items Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <div className="flex gap-2">
            <Button
              variant={isReorderingMenuItems ? 'primary' : 'outline'}
              onClick={() => setIsReorderingMenuItems(!isReorderingMenuItems)}
            >
              <ArrowUpDown size={16} className="mr-1" />
              {isReorderingMenuItems ? 'Done Reordering' : 'Reorder Items'}
            </Button>
            <Button onClick={handleAddMenuItem}>
              <Plus size={16} className="mr-1" />
              Add Menu Item
            </Button>
          </div>
        </div>

        {isReorderingMenuItems ? (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-8">
            <p className="text-sm text-blue-700 mb-4">
              Drag and drop menu items to reorder them. Click "Done Reordering" when finished.
            </p>
            <MenuItemDragList
              items={menuItems}
              onReorder={handleMenuItemReorder}
              onEdit={handleEditMenuItem}
              onDelete={handleDeleteMenuItem}
            />
          </div>
        ) : (
          <>
            <CategoryNavigation />

            <div className="mb-8">
              <MenuGrid
                onEditItem={handleEditMenuItem}
                onDeleteItem={handleDeleteMenuItem}
              />
            </div>
          </>
        )}
      </section>
      
      {/* QR Code Section */}
      <section className="mb-12">
        <div className="flex justify-center">
          <div className="max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-center">Menu QR Code</h2>
            <p className="text-gray-600 mb-4 text-center">
              This QR code will automatically update whenever you make changes to your menu.
            </p>
            <MenuQRCode value={menuUrl} />
          </div>
        </div>
      </section>
      
      {/* Menu Item Modal */}
      <Modal
        isOpen={isMenuItemModalOpen}
        onClose={() => setIsMenuItemModalOpen(false)}
        title={selectedMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
      >
        <MenuItemForm
          item={selectedMenuItem}
          onSubmit={handleMenuItemSubmit}
          onCancel={() => setIsMenuItemModalOpen(false)}
        />
      </Modal>
      
      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={selectedCategory ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <CategoryForm
          category={selectedCategory}
          onSubmit={handleCategorySubmit}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </Modal>
      
      {/* News/Event Modal */}
      <Modal
        isOpen={isNewsEventModalOpen}
        onClose={() => setIsNewsEventModalOpen(false)}
        title={selectedNewsEvent ? 'Edit News/Event' : 'Add News/Event'}
      >
        <NewsEventForm
          item={selectedNewsEvent}
          onSubmit={handleNewsEventSubmit}
          onCancel={() => setIsNewsEventModalOpen(false)}
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        size="sm"
      >
        <div>
          <p className="mb-4">
            Are you sure you want to delete this {deleteType}?
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPage;