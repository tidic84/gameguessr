'use client';

import React from 'react';
import AnimationExamples from '@/components/examples/AnimationExamples';
import NotificationHub from '@/components/ui/NotificationHub';

export default function AnimationsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <NotificationHub />
      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Démo des Animations UI</h1>
        <AnimationExamples />
      </main>
    </div>
  );
}
