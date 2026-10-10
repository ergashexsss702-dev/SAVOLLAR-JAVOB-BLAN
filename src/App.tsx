/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StarrySky } from './client/components/StarrySky.tsx';
import { Navbar } from './client/components/Navbar.tsx';
import { BackgroundModal } from './client/components/BackgroundModal.tsx';
import { AdminModal } from './client/components/AdminModal.tsx';
import { LoginPage } from './client/pages/LoginPage.tsx';
import { DashboardPage } from './client/pages/DashboardPage.tsx';
import { AuthProvider, useAuth } from './client/context/AuthContext.tsx';
import { ThemeProvider } from './client/context/ThemeContext.tsx';
import { LanguageProvider, useLanguage } from './client/context/LanguageContext.tsx';

function MainApp() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Starry Sky or Custom Background */}
      <StarrySky />

      {/* Navigation Header */}
      <Navbar
        onOpenBgModal={() => setBgModalOpen(true)}
        onOpenAdminModal={() => setAdminModalOpen(true)}
      />

      {/* Content Area */}
      <main className="flex-1">
        {user ? <DashboardPage /> : <LoginPage />}
      </main>

      {/* Modals */}
      <BackgroundModal
        isOpen={bgModalOpen}
        onClose={() => setBgModalOpen(false)}
      />

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-sm text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Savollarni javobi bilan. Barcha huquqlar himoyalangan.</span>
          <span>Bog‘lanish va kirish kodi: <a href="https://t.me/ergashexsss7o2" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">@ergashexsss7o2</a></span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
