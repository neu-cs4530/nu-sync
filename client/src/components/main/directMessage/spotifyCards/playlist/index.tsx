import React from 'react';
import { BsSpotify } from 'react-icons/bs';

type Props = {
  name: string;
  url: string;
  owner?: string;
  image?: string | null;
  description?: string;
};

const SpotifyPlaylistCard: React.FC<Props> = ({ name, url, owner, image, description }) => (
  <div className='flex justify-between items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-md transition'>
    <div className='flex items-start gap-4'>
      {image ? (
        <img src={image} alt={`${name} cover`} className='w-12 h-12 rounded' />
      ) : (
        <div className='w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-white'>
          <BsSpotify className='text-xl' />
        </div>
      )}
      <div className='flex flex-col'>
        <div className='text-white font-semibold'>{name}</div>
        {owner && <div className='text-gray-400 text-sm truncate'>By {owner}</div>}
        <a
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          onClick={e => e.stopPropagation()}
          className='text-[#1db954] text-sm hover:underline mt-1'>
          Open on Spotify
        </a>
      </div>
    </div>
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      onClick={e => e.stopPropagation()}
      className='text-[#1db954] hover:text-green-400 self-center ml-2'
      title='Open in Spotify'>
      <BsSpotify size={22} />
    </a>
  </div>
);

export default SpotifyPlaylistCard;
