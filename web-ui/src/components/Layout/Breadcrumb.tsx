import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="h-10 bg-surface-soft border-b border-hairline-soft">
      <div className="h-full max-w-[1400px] mx-auto px-6 flex items-center">
        <ol className="flex items-center gap-2 text-[13px]">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-3 h-3 text-ink/30" strokeWidth={1.5} />
              )}
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-ink/60 hover:text-ink transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-ink font-[480]">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
