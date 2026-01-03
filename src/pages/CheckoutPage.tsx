import React from 'react';
import { useNavigate } from 'react-router-dom';
import CartCheckout from '../components/CartCheckout';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return <CartCheckout onBack={handleBack} />;
};

export default CheckoutPage;
