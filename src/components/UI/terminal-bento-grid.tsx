import React from 'react';

interface BentoItemProps {
  className?: string;
  children: React.ReactNode;
}

const BentoItem = ({ className = '', children }: BentoItemProps) => {
  return (
    <div className={`bento-item ${className}`}>
      {children}
    </div>
  );
};

export default BentoItem;
