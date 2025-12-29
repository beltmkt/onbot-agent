import React from 'react';
import { Moon, Sun, LogOut, Database } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { auditService } from '../services/auditService';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    if (user?.email) {
      await auditService.logLogout(user.email, user.id);
    }
    await signOut();
    toast.success('Logout realizado com sucesso');
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                C<span className="text-blue-600 dark:text-blue-400">2</span>S CreateSeller
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Plataforma Corporativa Interna
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Contact2Sale
                </p>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
