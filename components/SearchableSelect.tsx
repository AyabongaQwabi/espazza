'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchableSelectProps {
  id: string;
  name: string;
  displayName: string;
  value: string;
  onChange: (value: string) => void;
  onCreateNew: (value: string) => Promise<string | null>;
  options: { id: string; name: string }[];
  placeholder: string;
}

export function SearchableSelect({
  id,
  name,
  displayName,
  value,
  onChange,
  onCreateNew,
  options,
  placeholder,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleCreateNew = async () => {
    const newId = await onCreateNew(search);
    if (newId) {
      onChange(newId);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {value
            ? options.find((option) => option.id === value)?.name
            : placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[300px] p-0'>
        <Command>
          <CommandInput
            placeholder={`Search ${displayName}...`}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <div className='flex-col gap-4 justify-center items-center py-2'>
                <span>No {displayName} found.</span>
                <br />
                <Button
                  type='button'
                  size='sm'
                  className='mt-4'
                  onClick={handleCreateNew}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Create "{search}"
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              <ScrollArea className='h-72'>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => {
                      onChange(option.id === value ? '' : option.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.name}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
