import React from 'react';
import { BsSpotify } from 'react-icons/bs';

type SpotifySongCardProps = {
  name: string;
  artists: string[];
  spotifyUrl: string;
  albumImage?: string;
  onClick?: () => void;
};

const SpotifySongCard: React.FC<SpotifySongCardProps> = ({
  name,
  artists,
  spotifyUrl,
  albumImage,
  onClick,
}) => (
  <div
    onClick={onClick}
    className='flex justify-between items-center p-3 bg-gray-800 hover:bg-gray-700 rounded-md cursor-pointer transition'>
    <div className='flex items-start gap-4'>
      {albumImage ? (
        <img src={albumImage} alt={`${name} album cover`} className='w-12 h-12 rounded' />
      ) : (
        <div className='w-12 h-12 bg-gray-600 rounded flex items-center justify-center text-white'>
          <BsSpotify className='text-xl' />
        </div>
      )}
      <div className='flex flex-col'>
        <div className='text-white font-semibold'>{name}</div>
        <div className='text-gray-400 text-sm'>{artists.join(', ')}</div>
        <a
          href={spotifyUrl}
          target='_blank'
          rel='noopener noreferrer'
          onClick={e => e.stopPropagation()}
          className='text-[#1db954] text-sm hover:underline mt-1'>
          Open on Spotify
        </a>
      </div>
    </div>
    <a
      href={spotifyUrl}
      target='_blank'
      rel='noopener noreferrer'
      onClick={e => e.stopPropagation()}
      className='text-[#1db954] hover:text-green-400 self-center ml-2'
      title='Open in Spotify'>
      <BsSpotify size={22} />
    </a>
  </div>
);

export default SpotifySongCard;
