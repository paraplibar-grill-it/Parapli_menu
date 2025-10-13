import React from 'react';
import { useMenu } from '../context/MenuContext';
import CategoryNavigation from '../components/CategoryNavigation';
import MenuGrid from '../components/MenuGrid';
import MenuQRCode from '../components/MenuQRCode';
import SpecialOffersSection from '../components/SpecialOffersSection';
import VirtualAssistant from '../components/VirtualAssistant';
import { Umbrella } from 'lucide-react';

const HomePage: React.FC = () => {
  const menuUrl = window.location.href;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Umbrella size={48} className="text-primary animate-float" />
          <h1 className="text-5xl font-bold gradient-text">Parapli Bar</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience our delicious menu of drinks and snacks in a warm, welcoming atmosphere.
        </p>
      </section>
      
      <SpecialOffersSection />
      
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-primary">Our Menu</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-accent mx-auto mt-2 rounded-full"></div>
        </div>
        
        <CategoryNavigation />
        <MenuGrid />
      </section>

      {/* Advertisement Section */}
      <section className="mb-16 relative overflow-hidden rounded-2xl">
        <div 
          className="h-[200px] bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg")',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/90" />
          <div className="relative h-full flex items-center justify-center text-center px-4">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-3">Karaoke | Acoustic Night!</h2>
              <p className="text-xl mb-4">Parapli Bar & Grill, since 2017.</p>
              <p className="text-2xl font-bold">Every Thursday | Friday</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="flex justify-center mb-16">
        <MenuQRCode value={menuUrl} />
      </section>

      <VirtualAssistant />
    </div>
  );
};

export default HomePage;