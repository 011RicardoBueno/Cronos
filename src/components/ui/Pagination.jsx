import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => onPageChange(1)} className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all bg-brand-card border border-brand-muted/20 text-brand-muted hover:border-brand-primary/50 hover:text-brand-primary">1</button>
      );
      if (startPage > 2) pages.push(<span key="start-ellipsis" className="text-brand-muted px-1">...</span>);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`
            w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all
            ${currentPage === i 
              ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110' 
              : 'bg-brand-card border border-brand-muted/20 text-brand-muted hover:border-brand-primary/50 hover:text-brand-primary'}
          `}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push(<span key="end-ellipsis" className="text-brand-muted px-1">...</span>);
      pages.push(
        <button key={totalPages} onClick={() => onPageChange(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all bg-brand-card border border-brand-muted/20 text-brand-muted hover:border-brand-primary/50 hover:text-brand-primary">{totalPages}</button>
      );
    }
    
    return pages;
  };

  return (
    <div className="flex justify-center items-center gap-2">
      <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg text-brand-muted hover:text-brand-text disabled:opacity-30 transition-colors">
        <ChevronLeft size={20} />
      </button>
      <div className="flex items-center gap-1">{renderPageNumbers()}</div>
      <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg text-brand-muted hover:text-brand-text disabled:opacity-30 transition-colors">
        <ChevronRight size={20} />
      </button>
    </div>
  );
}