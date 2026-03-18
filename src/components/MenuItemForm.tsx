import React, { useState, useEffect } from 'react';
import Input from './ui/Input';
import TextArea from './ui/TextArea';
import Select from './ui/Select';
import Button from './ui/Button';
import { useMenu } from '../context/MenuContext';
import type { MenuItem, MenuItemInput } from '../types';

const AVAILABLE_TAGS = [
  'Popular',
  'Featured',
  'New',
  'Special',
  '3 prestige = HTG500',
  'Special Price',
  'Up to 50% Discount',
  'Special 15% Discount',
  'Big Offer'
];

interface MenuItemFormProps {
  item?: MenuItem;
  onSubmit: (data: MenuItemInput) => Promise<void>;
  onCancel: () => void;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({ 
  item, 
  onSubmit,
  onCancel
}) => {
  const { categories } = useMenu();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MenuItemInput>({
    name: '',
    description: '',
    price: 0,
    category_id: categories[0]?.id || '',
    image_url: '',
    tags: [],
    sub_category: '',
    is_special_offer: false,
    original_price: undefined,
    is_pinned: false
  });
  
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category_id: item.category_id,
        image_url: item.image_url || '',
        tags: item.tags || [],
        sub_category: item.sub_category || '',
        is_special_offer: item.is_special_offer || false,
        original_price: item.original_price,
        is_pinned: item.is_pinned || false
      });
    }
  }, [item]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category_id: value });
  };

  const handleTagToggle = (tag: string) => {
    const newTags = formData.tags || [];
    const tagIndex = newTags.indexOf(tag);
    
    if (tagIndex === -1) {
      setFormData({ ...formData, tags: [...newTags, tag] });
    } else {
      setFormData({
        ...formData,
        tags: newTags.filter((_, index) => index !== tagIndex)
      });
    }
  };

  const handleSpecialOfferToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSpecial = e.target.checked;
    setFormData({
      ...formData,
      is_special_offer: isSpecial,
      original_price: isSpecial && !formData.original_price ? formData.price : formData.original_price
    });
  };

  const handlePinnedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      is_pinned: e.target.checked
    });
  };

  const handleOriginalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      original_price: parseFloat(e.target.value) || 0
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Name"
        id="name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        fullWidth
      />
      
      <TextArea
        label="Description"
        id="description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        rows={3}
        required
        fullWidth
      />
      
      <Input
        label="Price"
        id="price"
        name="price"
        type="number"
        min="0"
        step="0.01"
        value={formData.price.toString()}
        onChange={handleChange}
        required
        fullWidth
      />
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="is_pinned"
            name="is_pinned"
            checked={formData.is_pinned || false}
            onChange={handlePinnedToggle}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <label htmlFor="is_pinned" className="text-sm font-medium text-gray-700">
            Pin this item (highlight as available/recommended)
          </label>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="is_special_offer"
            name="is_special_offer"
            checked={formData.is_special_offer || false}
            onChange={handleSpecialOfferToggle}
            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="is_special_offer" className="text-sm font-medium text-gray-700">
            Special Offer
          </label>
        </div>
        
        {formData.is_special_offer && (
          <div className="ml-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-3">
              When enabled, the "Price" above becomes the special offer price, and you can set the original price below.
            </p>
            <Input
              label="Original Price"
              id="original_price"
              name="original_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.original_price?.toString() || ''}
              onChange={handleOriginalPriceChange}
              required={formData.is_special_offer}
              fullWidth
            />
          </div>
        )}
      </div>
      
      <Select
        label="Category"
        id="category_id"
        name="category_id"
        value={formData.category_id}
        onChange={handleCategoryChange}
        options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
        required
        fullWidth
      />

      <Input
        label="Sub-category"
        id="sub_category"
        name="sub_category"
        value={formData.sub_category || ''}
        onChange={handleChange}
        placeholder="e.g., Hot Drinks, Cold Drinks, Appetizers, etc."
        fullWidth
      />
      
      <Input
        label="Image URL (optional)"
        id="image_url"
        name="image_url"
        value={formData.image_url || ''}
        onChange={handleChange}
        fullWidth
        placeholder="https://example.com/image.jpg"
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                formData.tags?.includes(tag)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
              }`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {item ? 'Update' : 'Create'} Menu Item
        </Button>
      </div>
    </form>
  );
};

export default MenuItemForm;