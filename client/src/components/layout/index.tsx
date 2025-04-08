import React from 'react';
import './index.css';
import { Outlet } from 'react-router-dom';
import SideBarNav from '../main/sideBarNav';
import Header from '../header';

/**
 * Main layout component that matches the profile settings page styling.
 * Combines header, sidebar, and main content area.
 */
const Layout = () => (
  <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
    <Header />

    <div className="flex flex-1 overflow-hidden">
      <div className="w-56 flex-shrink-0">
        <SideBarNav />
      </div>

      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  </div>
);

export default Layout;
