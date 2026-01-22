import { Link } from 'react-router-dom';
import { House, Calendar, Folder, Layers2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <nav className={cn('w-16 backdrop-blur-sm border-r border-primary/15 flex flex-col items-center py-4', className)}>
      <ul className="flex flex-col gap-2">
        <li>
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000b3] hover:text-[#324155] transition-colors"
          >
            <House />
          </Link>
        </li>
        <li>
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000b3] hover:text-[#324155] transition-colors"
          >
            <Calendar />
          </Link>
        </li>
        <li>
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000b3] hover:text-[#324155] transition-colors"
          >
            <Folder />
          </Link>
        </li>
        <li>
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000b3] hover:text-[#324155] transition-colors"
          >
            <Layers2 />
          </Link>
        </li>
        <li>
          <Link
            to="/recursos"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-[#000000b3] hover:text-[#324155] transition-colors"
          >
            <FileText />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
