import React from 'react';

const MutedSpeechBubble = ({ size = 24, color = "#6b7280" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Speech bubble shape */}
      <path 
        d="M 4 6 
           C 2.89543 6, 2 6.89543, 2 8
           L 2 14
           C 2 15.1046, 2.89543 16, 4 16
           L 5 16
           L 5 20
           L 9 16
           L 16 16
           C 17.1046 16, 18 15.1046, 18 14
           L 18 8
           C 18 6.89543, 17.1046 6, 16 6
           Z" 
        fill={color}
        rx="1.5"
      />
      
      {/* Silence indicator (small dot) */}
      <circle 
        cx="10" 
        cy="11" 
        r="1.5" 
        fill="#f8f6f5"
      />
    </svg>
  );
};

export default MutedSpeechBubble;
