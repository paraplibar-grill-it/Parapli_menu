import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import type { MenuItem } from '../types';

interface SortableMenuItemProps {
  item: MenuItem;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SortableMenuItemRow: React.FC<SortableMenuItemProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-lg p-4 flex items-center gap-4 ${
        isDragging ? 'border-primary shadow-lg' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
      >
        <GripVertical size={20} />
      </div>

      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-12 h-12 rounded object-cover"
        />
      )}

      <div className="flex-grow">
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        <p className="text-sm text-gray-500">
          {item.description ? item.description.substring(0, 50) : 'No description'}
          {item.description && item.description.length > 50 ? '...' : ''}
        </p>
      </div>

      <div className="text-right mr-4">
        <p className="font-semibold text-gray-900">${item.price.toFixed(2)}</p>
        {item.is_special_offer && (
          <p className="text-xs font-medium text-orange-600">Special Offer</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(item.id)}
        >
          <Edit size={16} />
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
};

interface MenuItemDragListProps {
  items: MenuItem[];
  onReorder: (newOrder: MenuItem[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const MenuItemDragList: React.FC<MenuItemDragListProps> = ({
  items,
  onReorder,
  onEdit,
  onDelete,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(items, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No menu items found. Add your first item!
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => (
            <SortableMenuItemRow
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default MenuItemDragList;
