import React, { useState, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const AccessibleInput = ({ 
  label, 
  error, 
  required = false, 
  type = 'text',
  description,
  ...props 
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={id} 
        className="text-white font-medium"
      >
        {label}
        {required && <span className="text-red-400 ml-1" aria-label="Campo obbligatorio">*</span>}
      </Label>
      
      {description && (
        <p 
          id={descriptionId}
          className="text-gray-400 text-sm"
        >
          {description}
        </p>
      )}
      
      <Input
        id={id}
        type={type}
        className={`bg-slate-800/50 border-slate-600 text-white placeholder:text-gray-400 
          ${error ? 'border-red-500 focus:border-red-400' : 'focus:border-blue-400'}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : description ? descriptionId : undefined}
        aria-required={required}
        {...props}
      />
      
      {error && (
        <Alert 
          variant="destructive" 
          className="py-2 px-3"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription id={errorId} className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const AccessibleButton = ({ 
  children, 
  loading = false, 
  loadingText = 'Caricamento...',
  description,
  ...props 
}) => {
  return (
    <Button
      disabled={loading || props.disabled}
      aria-busy={loading}
      aria-label={description}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  );
};

export const AccessibleCard = ({ 
  children, 
  title, 
  description, 
  className = '',
  ...props 
}) => {
  const titleId = useId();
  
  return (
    <div
      className={`sardinian-card ${className}`}
      role="article"
      aria-labelledby={title ? titleId : undefined}
      {...props}
    >
      {title && (
        <div className="p-6 pb-0">
          <h3 id={titleId} className="text-white font-semibold text-lg">
            {title}
          </h3>
          {description && (
            <p className="text-gray-400 text-sm mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};