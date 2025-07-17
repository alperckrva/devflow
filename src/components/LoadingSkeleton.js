import React from 'react';

// 🔄 Genel Loading Skeleton Component
export const LoadingSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="flex space-x-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};

// 📊 İstatistik Kartları için Loading
export const StatCardSkeleton = () => {
  return (
    <div className="animate-pulse p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="text-center space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-1 w-16 mx-auto"></div>
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-20 mx-auto"></div>
      </div>
    </div>
  );
};

// 📝 Not Kartları için Loading
export const NoteCardSkeleton = () => {
  return (
    <div className="animate-pulse p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="space-y-3">
        {/* Başlık */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        {/* İçerik */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-4/6"></div>
        </div>
        {/* Alt bilgiler */}
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
};

// 📅 Plan Kartları için Loading
export const PlanCardSkeleton = () => {
  return (
    <div className="animate-pulse p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        {/* Checkbox */}
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
        {/* İçerik */}
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
        {/* Tarih */}
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );
};

// 🐙 GitHub Proje Kartları için Loading
export const ProjectCardSkeleton = () => {
  return (
    <div className="animate-pulse p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        {/* Başlık ve dil */}
        <div className="flex justify-between items-start">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-5 bg-blue-200 dark:bg-blue-700 rounded w-16"></div>
        </div>
        {/* Açıklama */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-full"></div>
          <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded w-3/4"></div>
        </div>
        {/* İstatistikler */}
        <div className="flex space-x-4">
          <div className="h-4 bg-yellow-200 dark:bg-yellow-700 rounded w-12"></div>
          <div className="h-4 bg-green-200 dark:bg-green-700 rounded w-12"></div>
          <div className="h-4 bg-purple-200 dark:bg-purple-700 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
};

// 🤖 AI Chat mesajları için Loading
export const ChatMessageSkeleton = () => {
  return (
    <div className="animate-pulse flex space-x-3 p-4">
      {/* Avatar */}
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      {/* Message */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    </div>
  );
};

// 📋 Liste Loading
export const ListSkeleton = ({ items = 5, type = 'default' }) => {
  const SkeletonComponent = {
    note: NoteCardSkeleton,
    plan: PlanCardSkeleton,
    project: ProjectCardSkeleton,
    stat: StatCardSkeleton,
    default: LoadingSkeleton
  }[type] || LoadingSkeleton;

  return (
    <div className="space-y-4">
      {Array.from({ length: items }, (_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
};

export default LoadingSkeleton; 