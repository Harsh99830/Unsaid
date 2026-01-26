import React from 'react';

const FloatingActionButton = ({ onClick, icon = '➕', position = 'bottom-24 right-6' }) => {
  return (
    <button
      className={`fixed ${position} size-14 bg-[#f45925] text-white rounded-full shadow-lg shadow-[#f45925]/40 flex items-center justify-center transition-transform active:scale-90 z-40 hover:scale-105`}
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
    </button>
  );
};

export default FloatingActionButton;
