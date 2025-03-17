'use client';

import type React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
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
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  artist_name: z.string().min(2, {
    message: 'Artist name must be at least 2 characters.',
  }),
  town_id: z.string().uuid().or(z.literal('')),
  record_label_id: z.string().uuid().or(z.literal('')),
  distributor_id: z.string().uuid(),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

export default function BasicInfoPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [towns, setTowns] = useState<
    Database['public']['Tables']['south_african_towns']['Row'][]
  >([]);
  const [recordLabels, setRecordLabels] = useState<
    Database['public']['Tables']['record_labels']['Row'][]
  >([]);
  const [distributors, setDistributors] = useState<
    Database['public']['Tables']['distributors']['Row'][]
  >([]);
  const [newTown, setNewTown] = useState('');
  const [newTownProvince, setNewTownProvince] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDistributor, setNewDistributor] = useState('');

  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      artist_name: '',
      town_id: '',
      record_label_id: '',
      distributor_id: '',
      bio: '',
    },
  });

  const [formData, setFormData] = useState(form.getValues());

  useEffect(() => {
    setFormData(form.getValues());
  }, [form.watch()]);

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

    const { data: distributorsData } = await supabase
      .from('distributors')
      .select('*')
      .order('name');
    setDistributors(distributorsData || []);

    // Load user's current data
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        // Set default values for required fields if they're empty
        const updatedProfileData = {
          ...profileData,
          town_id: profileData.town_id || '',
          record_label_id: profileData.record_label_id || '',
          distributor_id: profileData.distributor_id || '',
        };

        setFormData(updatedProfileData);
      }
    }
  }

  async function createTown() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('south_african_towns')
        .insert([{ name: newTown, province: newTownProvince }]);
      if (error) throw error;
      setNewTown('');
      setNewTownProvince('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createLabel() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('record_labels')
        .insert([{ name: newLabel }]);
      if (error) throw error;
      setNewLabel('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function createDistributor() {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('distributors')
        .insert([{ name: newDistributor }]);
      if (error) throw error;
      setNewDistributor('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required UUID fields
      if (!formData.town_id) {
        throw new Error(
          'Please select a town from the dropdown or add a new one'
        );
      }

      if (!formData.record_label_id) {
        throw new Error(
          'Please select a record label from the dropdown or add a new one'
        );
      }

      if (!formData.distributor_id) {
        throw new Error(
          'Please select a distributor from the dropdown or add a new one'
        );
      }

      // Validate UUID format for the IDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (
        formData.town_id !== 'Independent' &&
        !uuidRegex.test(formData.town_id)
      ) {
        throw new Error(
          'Invalid town selection. Please select a valid town from the dropdown'
        );
      }

      if (
        formData.record_label_id !== 'Independent' &&
        !uuidRegex.test(formData.record_label_id)
      ) {
        throw new Error(
          'Invalid record label selection. Please select a valid record label from the dropdown'
        );
      }

      if (!uuidRegex.test(formData.distributor_id)) {
        throw new Error(
          'Invalid distributor selection. Please select a valid distributor from the dropdown'
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...formData,
          basic_info_complete: true,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        if (
          updateError.message.includes('invalid input syntax for type uuid')
        ) {
          throw new Error(
            'One or more selections contain invalid data. Please check your town, record label, and distributor selections.'
          );
        }
        throw updateError;
      }

      router.push('/onboarding/media');
    } catch (err: any) {
      setError(err.message);
      // Scroll to the error message
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='container mx-auto max-w-2xl'>
      <h1 className='text-3xl font-bold mb-4'>Basic Information</h1>
      <Form {...form}>
        <form onSubmit={handleSubmit} className='space-y-8'>
          <FormField
            control={form.control}
            name='first_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder='First Name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='last_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder='Last Name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='artist_name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artist Name</FormLabel>
                <FormControl>
                  <Input placeholder='Artist Name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <Label htmlFor='town' className='flex items-center'>
              Town <span className='text-red-500 ml-1'>*</span>
            </Label>
            <div className='flex gap-2'>
              <Select
                value={formData.town_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, town_id: value })
                }
                required
              >
                <SelectTrigger
                  className={`flex-1 ${
                    !formData.town_id ? 'border-red-500' : ''
                  }`}
                >
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
                        required
                      />
                    </div>
                    <div>
                      <Label>Province</Label>
                      <Select
                        value={newTownProvince}
                        onValueChange={setNewTownProvince}
                        required
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
                    <Button
                      onClick={createTown}
                      disabled={!newTown || !newTownProvince}
                    >
                      Add Town
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {!formData.town_id && (
              <p className='text-red-500 text-xs mt-1'>
                Town selection is required
              </p>
            )}
          </div>

          <div>
            <Label className='flex items-center'>
              Record Label <span className='text-red-500 ml-1'>*</span>
            </Label>
            <div className='flex gap-2'>
              <Select
                value={formData.record_label_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, record_label_id: value })
                }
                required
              >
                <SelectTrigger
                  className={`flex-1 ${
                    !formData.record_label_id ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder='Select record label' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Independent'>Independent</SelectItem>
                  {recordLabels?.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='outline'>Add Label</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Record Label</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <Label>Label Name</Label>
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        required
                      />
                    </div>
                    <Button onClick={createLabel} disabled={!newLabel}>
                      Add Label
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {!formData.record_label_id && (
              <p className='text-red-500 text-xs mt-1'>
                Record label selection is required
              </p>
            )}
          </div>

          <div>
            <Label className='flex items-center'>
              Distributor <span className='text-red-500 ml-1'>*</span>
            </Label>
            <div className='flex gap-2'>
              <Select
                value={formData.distributor_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, distributor_id: value })
                }
                required
              >
                <SelectTrigger
                  className={`flex-1 ${
                    !formData.distributor_id ? 'border-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder='Select distributor' />
                </SelectTrigger>
                <SelectContent>
                  {distributors?.map((distributor) => (
                    <SelectItem key={distributor.id} value={distributor.id}>
                      {distributor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='outline'>Add Distro</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Distributor</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <Label>Distributor Name</Label>
                      <Input
                        value={newDistributor}
                        onChange={(e) => setNewDistributor(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      onClick={createDistributor}
                      disabled={!newDistributor}
                    >
                      Add Distro
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {!formData.distributor_id && (
              <p className='text-red-500 text-xs mt-1'>
                Distributor selection is required
              </p>
            )}
          </div>

          <FormField
            control={form.control}
            name='bio'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Input placeholder='Bio' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit' disabled={loading}>
            {loading ? 'Loading...' : 'Submit'}
          </Button>
        </form>
      </Form>
      {error && (
        <div className='bg-red-500/10 border border-red-500/50 rounded-lg p-4 animate-pulse'>
          <p className='text-red-500 font-medium'>{error}</p>
          {error.includes('invalid') && (
            <ul className='text-red-400 text-sm mt-2 list-disc list-inside'>
              <li>Make sure you've selected a valid town from the dropdown</li>
              <li>
                Make sure you've selected a valid record label from the dropdown
              </li>
              <li>
                Make sure you've selected a valid distributor from the dropdown
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
