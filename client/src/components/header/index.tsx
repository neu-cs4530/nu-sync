import React from 'react';
import { useNavigate } from 'react-router-dom';
import useHeader from '../../hooks/useHeader';
import useUserContext from '../../hooks/useUserContext';

/**
 * Header component with profile button styled to match the question tag style
 */
const Header = () => {
  const { handleSignOut } = useHeader();
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-10 py-3 flex items-center justify-between sticky top-0 z-10">
      <div
        className="text-xl font-semibold text-gray-800 cursor-pointer flex items-center"
        onClick={() => navigate('/home')}
      >
        <div className="bg-[#4361ee] text-white w-10 h-10 rounded-full flex items-center justify-center mr-1 shadow-sm">
          <span className="font-bold">NU</span>
        </div>
        <span>Sync</span>
      </div>

      <div className="flex items-center space-x-3">
        <button
          className="px-5 py-2 rounded-md bg-[#4b5563] text-white text-sm font-medium hover:bg-[#374151] transition-colors"
          onClick={() => navigate(`/user/${currentUser.username}`)}
        >
          Profile
        </button>
        <button
          className="px-5 py-2 rounded-md bg-[#4361ee] text-white text-sm font-medium hover:bg-[#3b52c9] transition-colors shadow-sm"
          onClick={handleSignOut}
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Header;
