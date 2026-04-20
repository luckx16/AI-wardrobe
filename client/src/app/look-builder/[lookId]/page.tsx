'use client';

import { useParams } from 'next/navigation';

import { LookBuilder } from '@/widgets/LookBuilder';

export default function LookEditPage() {
  const { lookId } = useParams();

  return <LookBuilder lookId={lookId as string} />;
}
