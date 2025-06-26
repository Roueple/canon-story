import React from 'react';

export function PlaceholderPage({ title, message }: { title: string; message?: string }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4 text-foreground">{title}</h1>
      <p className="text-lg text-muted-foreground">
        {message || 'This page is under construction and will be available soon.'}
      </p>
    </div>
  );
}