'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

export type ReportFormState = {
  date: string;
  title: string;
  body: string;
  hours?: string;
  tags?: string;
};

const initialState: ReportFormState = {
  date: '',
  title: '',
  body: '',
  hours: '',
  tags: '',
};

export const ReportForm = () => {
  const [form, setForm] = useState<ReportFormState>(initialState);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Submit report form', form);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="date">
          Date
        </label>
        <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="title">
          Title
        </label>
        <Input id="title" name="title" type="text" value={form.title} onChange={handleChange} required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="body">
          Body
        </label>
        <Textarea id="body" name="body" rows={6} value={form.body} onChange={handleChange} required />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="hours">
          Hours
        </label>
        <Input
          id="hours"
          name="hours"
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={form.hours}
          onChange={handleChange}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="tags">
          Tags (comma separated)
        </label>
        <Input id="tags" name="tags" type="text" value={form.tags} onChange={handleChange} />
      </div>

      <Button type="submit">Save Draft</Button>
    </form>
  );
};
