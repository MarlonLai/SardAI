import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const ChatMessageSkeleton = () => (
  <div className="space-y-4 p-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${
          i % 2 === 0 ? 'flex-row-reverse space-x-reverse' : ''
        }`}>
          <Skeleton className="w-8 h-8 rounded-full bg-slate-700" />
          <Card className="bg-slate-800/50 border-0 flex-1">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-full mb-2 bg-slate-700" />
              <Skeleton className="h-4 w-3/4 mb-2 bg-slate-700" />
              <Skeleton className="h-3 w-16 bg-slate-700" />
            </CardContent>
          </Card>
        </div>
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 p-6">
    {/* Header skeleton */}
    <Card className="sardinian-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-slate-700" />
            <Skeleton className="h-4 w-64 bg-slate-700" />
          </div>
          <Skeleton className="h-10 w-32 bg-slate-700" />
        </div>
      </CardContent>
    </Card>

    {/* Stats skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="sardinian-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-slate-700" />
                <Skeleton className="h-8 w-12 bg-slate-700" />
              </div>
              <Skeleton className="w-8 h-8 rounded bg-slate-700" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Content skeleton */}
    <Card className="sardinian-card">
      <CardHeader>
        <Skeleton className="h-6 w-40 bg-slate-700" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 bg-slate-800/30 rounded-lg">
              <Skeleton className="w-5 h-5 rounded bg-slate-700" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-slate-700" />
                <Skeleton className="h-3 w-1/2 bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export const UserTableSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border-b border-slate-700">
        <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48 bg-slate-700" />
          <Skeleton className="h-3 w-32 bg-slate-700" />
        </div>
        <Skeleton className="w-20 h-6 rounded-full bg-slate-700" />
        <div className="flex space-x-2">
          <Skeleton className="w-8 h-8 rounded bg-slate-700" />
          <Skeleton className="w-8 h-8 rounded bg-slate-700" />
        </div>
      </div>
    ))}
  </div>
);