import React from 'react';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { ConditionsSection } from './ConditionsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { CallToActionFooter } from './CallToActionFooter';

export const HomePageContent: React.FC = () => {
  return (
    <>
      <HeroSection />
      <StatsSection id="about" />
      <ConditionsSection id="features" />
      <TestimonialsSection />
      <CallToActionFooter />
    </>
  );
};