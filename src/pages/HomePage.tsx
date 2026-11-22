import { useSeo } from '@/lib/seo';
import { Hero } from '@/components/home/Hero';
import { Pillars } from '@/components/home/Pillars';
import { Doors } from '@/components/home/Doors';
import { Creations } from '@/components/home/Creations';
import { TextureGallery } from '@/components/home/TextureGallery';
import { HowItWorks } from '@/components/home/HowItWorks';
import { VisionBand } from '@/components/home/VisionBand';
import { AboutTeaser } from '@/components/home/AboutTeaser';
import { ForWho } from '@/components/home/ForWho';
import { FaqTeaser } from '@/components/home/FaqTeaser';
import { FinalCta } from '@/components/home/FinalCta';
import { AuditHomeBlock } from '@/components/AuditPromo';

export function HomePage({ started }: { started: boolean }) {
  useSeo({
    title: 'Leslie Cosmétique',
    description:
      'Formations et coachings en cosmétique naturelle : apprenez à formuler vos soins capillaires et cosmétiques, et lancez votre marque avec Leslie Djoman.',
    path: '/',
    image: '/og-image.webp',
  });

  return (
    <>
      <Hero started={started} />
      <Pillars />
      <Doors />
      <AuditHomeBlock />
      <Creations />
      <VisionBand />
      <HowItWorks />
      <TextureGallery />
      <ForWho />
      <AboutTeaser />
      <FaqTeaser />
      <FinalCta />
    </>
  );
}
