'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

export default function FanOnboarding() {
  const [towns, setTowns] = useState<any[]>([]);
  const [newTown, setNewTown] = useState('');
  const [newTownProvince, setNewTownProvince] = useState('');
  const [recordLabels, setRecordLabels] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [formData, setFormData] = useState({
    favorite_genres: 'Hip Hop, Trap',
    favorite_artists: 'Bravo Le Roux, Dee Koala, Holy Alpha',
    artist_bio: '',
    artist_name: '',
    date_of_birth: '',
    sa_id_number: '',
    phone_number: '',
    street_address: '',
    suburb: '',
    province: '',
    town_id: '',
  });
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: townsData } = await supabase
      .from('south_african_towns')
      .select('*')
      .order('name');
    setTowns(townsData || []);

    const { data: labelsData } = await supabase
      .from('record_labels')
      .select('*')
      .order('name');
    setRecordLabels(labelsData || []);
  }

  async function createTown() {
    const { data, error } = await supabase
      .from('south_african_towns')
      .insert([{ name: newTown, province: newTownProvince }])
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setTowns([...towns, data]);
    setNewTown('');
    setNewTownProvince('');
  }

  async function createLabel() {
    const { data, error } = await supabase
      .from('record_labels')
      .insert([{ name: newLabel }])
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setRecordLabels([...recordLabels, data]);
    setNewLabel('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          favorite_genres: formData.favorite_genres,
          favorite_artists: formData.favorite_artists,
          artist_bio: formData.artist_bio,
          registration_complete: true,
          basic_info_complete: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your fan profile has been updated.',
      });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating fan profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update fan profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-4'>Fan Information</h1>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-semibold text-white mb-4'>
            Personal Information
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='artist_name'>Your Name</Label>
              <Input
                id='artist_name'
                value={formData.artist_name}
                onChange={(e) =>
                  setFormData({ ...formData, artist_name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor='date_of_birth'>Date of Birth</Label>
              <Input
                id='date_of_birth'
                type='date'
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor='phone_number'>Phone Number</Label>
              <Input
                id='phone_number'
                type='tel'
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                required
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-semibold text-white mb-4'>
            Address Information
          </h2>

          <div className='space-y-4'>
            <div>
              <Label htmlFor='street_address'>Street Address</Label>
              <Input
                id='street_address'
                value={formData.street_address}
                onChange={(e) =>
                  setFormData({ ...formData, street_address: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor='suburb'>Suburb</Label>
              <Input
                id='suburb'
                value={formData.suburb}
                onChange={(e) =>
                  setFormData({ ...formData, suburb: e.target.value })
                }
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='province'>Province</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) =>
                    setFormData({ ...formData, province: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select province' />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES?.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='town'>Town</Label>
                <div className='flex gap-2'>
                  <Select
                    value={formData.town_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, town_id: value })
                    }
                  >
                    <SelectTrigger className='flex-1'>
                      <SelectValue placeholder='Select town' />
                    </SelectTrigger>
                    <SelectContent>
                      {towns?.map((town) => (
                        <SelectItem key={town.id} value={town.id}>
                          {town.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant='outline'>Add Town</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Town</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div>
                          <Label>Town Name</Label>
                          <Input
                            value={newTown}
                            onChange={(e) => setNewTown(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Province</Label>
                          <Select
                            value={newTownProvince}
                            onValueChange={setNewTownProvince}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select province' />
                            </SelectTrigger>
                            <SelectContent>
                              {PROVINCES?.map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={createTown}>Add Town</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='bg-zinc-900 rounded-lg p-6 space-y-4'>
          <div>
            <Label htmlFor='favorite_genres'>Favorite Genres</Label>
            <Input
              id='favorite_genres'
              value={formData.favorite_genres}
              onChange={(e) =>
                setFormData({ ...formData, favorite_genres: e.target.value })
              }
              required
              placeholder='e.g., Hip Hop, R&B, Jazz'
            />
          </div>
          <div>
            <Label htmlFor='favorite_artists'>Favorite Artists</Label>
            <Input
              id='favorite_artists'
              value={formData.favorite_artists}
              onChange={(e) =>
                setFormData({ ...formData, favorite_artists: e.target.value })
              }
              required
              placeholder='e.g., Artist1, Artist2, Artist3'
            />
          </div>
          <div>
            <Label htmlFor='bio'>Bio</Label>
            <Textarea
              id='bio'
              value={formData.artist_bio}
              onChange={(e) =>
                setFormData({ ...formData, artist_bio: e.target.value })
              }
              required
            />
          </div>
        </div>
        <Button type='submit'>Save and Continue</Button>
      </form>
    </div>
  );
}
