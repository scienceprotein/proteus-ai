import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#060a0f] text-[#e8f0f8]">
      <Navbar />
      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
}
