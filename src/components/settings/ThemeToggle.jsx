import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800"
      style={{ boxShadow: '0 2px 12px rgba(45,106,79,0.08)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: isDark ? '#1E293B' : '#FEF3C7' }}
        >
          {isDark ? <Moon size={20} className="text-blue-300" /> : <Sun size={20} className="text-amber-500" />}
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900 dark:text-white">Modo oscuro</p>
          <p className="text-xs text-gray-400">Reduce la fatiga visual de noche 🌙</p>
        </div>
      </div>
      <button
        onClick={toggleTheme}
        className="relative w-14 h-8 rounded-full transition-colors flex-shrink-0"
        style={{ backgroundColor: isDark ? '#2D6A4F' : '#D1D5DB' }}
        aria-label="Cambiar tema"
      >
        <span
          className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform flex items-center justify-center text-xs"
          style={{ transform: isDark ? 'translateX(24px)' : 'translateX(0)' }}
        >
          {isDark ? '🌙' : '☀️'}
        </span>
      </button>
    </div>
  );
}