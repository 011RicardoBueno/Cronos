import React from 'react';

const SkeletonCard = ({ top, height }) => (
  <div
    className="absolute left-2 right-2 bg-brand-surface rounded-lg animate-pulse"
    style={{ top, height }}
  />
);

export default function AgendaSkeleton({ professionalCount, timeSlotsCount }) {
  // A few predefined positions for a more "natural" look
  const skeletonSlots = [
    { top: '5rem', height: '3.5rem' },
    { top: '13rem', height: '7.5rem' },
    { top: '25rem', height: '3.5rem' },
    { top: '33rem', height: '5.5rem' },
    { top: '42rem', height: '3.5rem' },
  ];

  return (
    <>
      {Array.from({ length: professionalCount }).map((_, index) => (
        <div key={index} className="flex-1 min-w-[250px] border-l border-brand-muted/10 relative">
          {/* Header placeholder */}
          <div className="h-16 flex items-center justify-center p-2 sticky top-0 bg-brand-card z-10">
             <div className="h-4 w-2/3 bg-brand-surface rounded animate-pulse"></div>
          </div>
          {/* Grid lines */}
          {Array.from({ length: timeSlotsCount }).map((_, i) => (
            <div key={i} className="h-16 border-t border-brand-muted/10"></div>
          ))}
          {/* Skeleton cards */}
          <div className="absolute top-16 left-0 right-0 bottom-0">
            {skeletonSlots.map((slot, i) => (
              <SkeletonCard key={i} top={slot.top} height={slot.height} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}