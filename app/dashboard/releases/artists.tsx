import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import short from 'short-uuid';
import { toast } from '@/hooks/use-toast';

export const ArtistMultiSelect = ({ id, title, song, updateSong }) => {
  console.log('song:', song, id);
  const [search, setSearch] = useState('');
  const [artists, setArtists] = useState([]);

  const addNewArtistOrProducer = async (name) => {
    const { data, error } = await supabase
      .from('unregistered_profiles')
      .insert([{ artist_name: name, id: short().toUUID(short.generate()) }])
      .select();

    if (error) {
      console.error('Error adding new profile:', error);
      toast({ title: 'Error', description: 'Could not add profile' });
    } else {
      toast({
        title: 'Success',
        description: 'Profile added successfully',
      });
      fetchArtists();
    }
  };

  const fetchArtists = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('artist_name, id')
      .order('artist_name', { ascending: true });

    if (error) {
      console.error('Error fetching artists:', error);
    } else {
      const { data: unregArtists, error } = await supabase
        .from('unregistered_profiles')
        .select('artist_name, id')
        .order('artist_name', { ascending: true });

      console.log('unregArtists:', unregArtists);

      const artists = [
        ...data,
        ...unregArtists?.map((a) => ({ ...a, is_unregistered: true })),
      ];
      setArtists(artists || []);
    }
  }, []);

  useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);
  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium my-2 mt-4'>{title}</p>
      <Input
        placeholder='Search artists...'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className='h-8 w-full'
      />
      <div className='flex gap-2 my-4'>
        {song[id]?.map((artist) => (
          <span className='bg-gray-100 text-gray-700 rounded-lg p-1 text-xs flex gap-2'>
            {artist.artist_name}
            <button
              className='ml-2 bg-red-500 text-white rounded-md flex justify-center items-center p-1 w-4 h-4'
              onClick={(e) => {
                e.preventDefault();
                const items = song[id].filter((p) => p.id !== artist.id);
                updateSong({ ...song, [id]: items });
              }}
            >
              x
            </button>
          </span>
        ))}
      </div>
      {search !== ''
        ? artists
            .filter((artist) =>
              artist?.artist_name?.toLowerCase().includes(search.toLowerCase())
            )
            .map((artist) => (
              <p
                id={artist.id}
                type='button'
                className='cursor-pointer hover:underline p-1'
                onClick={(e) => {
                  e.preventDefault();
                  const items = song[id].concat(artist);
                  updateSong({ ...song, [id]: items });
                  setSearch('');
                }}
              >
                {artist.artist_name}
              </p>
            ))
        : ''}
      {!artists.some(
        (artist) => artist?.artist_name?.toLowerCase() === search.toLowerCase()
      ) &&
        search && (
          <Button
            onClick={(e) => {
              e.preventDefault();
              addNewArtistOrProducer(search);
            }}
          >
            Add "{search}"
          </Button>
        )}
    </div>
  );
};
