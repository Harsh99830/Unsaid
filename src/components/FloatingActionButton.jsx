import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FloatingActionButton = ({ onClick, icon, position = 'bottom-24 right-6' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/create');
    }
  };

  return (
    <button
      className={`fixed ${position} size-14 bg-[#f45925] text-white rounded-full shadow-lg shadow-[#f45925]/40 flex items-center justify-center transition-transform active:scale-90 z-40 hover:scale-105`}
      onClick={handleClick}
    >
      <span>
        <Plus size={24} />
      </span>
    </button>
  );
};

export default FloatingActionButton;
