'use client';

import TopBar from './layout/TopBar';
import MainNav from './layout/MainNav';
import CategoryBar from './layout/CategoryBar';

export default function Header() {
  return (
    <header>
      <TopBar />
      <MainNav />
      <CategoryBar />
    </header>
  );
}

