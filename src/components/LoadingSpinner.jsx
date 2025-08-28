import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Caricamento...', 
  fullScreen = false,
  className = '' 
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="relative">
        {/* Outer spinning ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size]} border-4 border-blue-500/20 border-t-blue-500 rounded-full`}
        />
        
        {/* Inner SardAI logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${sizeClasses[size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'md'} sardinian-gradient rounded-full flex items-center justify-center`}>
            <Sparkles className={`${size === 'sm' ? 'w-3 h-3' : size === 'xl' ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
          </div>
        </div>
      </div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-white ${textSizeClasses[size]} font-medium text-center`}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen sardinian-pattern flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}