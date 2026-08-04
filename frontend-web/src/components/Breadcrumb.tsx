import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-brand-muted font-medium py-3 px-1">
      <ol className="inline-flex items-center space-x-1 md:space-x-1.5">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-brand-muted hover:text-brand-primary transition-colors duration-200"
          >
            Trang chủ
          </Link>
        </li>
        
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-brand-border-strong mx-1 shrink-0" />
              {isLast || !item.path ? (
                <span className="text-brand-dark font-semibold select-none">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-brand-muted hover:text-brand-primary transition-colors duration-200"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
