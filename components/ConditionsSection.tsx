
import React from 'react';
import { DentalCondition } from '../types';

// Custom SVG Icons for Dental Conditions
const CariesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" fill="currentColor" {...props}>
    <path d="M32,10c-10.3,0-18.7,8.4-18.7,18.7c0,8.1,5.2,15,12.4,17.7V50c0,1.1,0.9,2,2,2h8.7c1.1,0,2-0.9,2-2V46.3c7.2-2.7,12.4-9.5,12.4-17.7C50.7,18.4,42.3,10,32,10z M38.7,40.1c-1.2,0.4-2.4,0.6-3.7,0.6c-2.5,0-4.9-0.9-6.8-2.4L28,38.1c-0.6-0.5-1-1.3-1-2.1c0-1.4,1.1-2.5,2.5-2.5s2.5,1.1,2.5,2.5c0,0.1,0,0.2-0.1,0.3l0.2-0.2c0.9-0.8,2-1.2,3.2-1.2c1.7,0,3.3,0.8,4.3,2.1C40.1,38.1,39.6,39.3,38.7,40.1z M42.7,32.5c-0.8,1.1-2,1.8-3.3,1.8c-0.9,0-1.8-0.3-2.5-0.9l-0.1-0.1c-0.5-0.4-0.8-1-0.8-1.7c0-1.1,0.9-2,2-2s2,0.9,2,2c0,0,0,0.1,0,0.1l0.1-0.1c0.6-0.5,1.3-0.7,2-0.7c1.1,0,2.1,0.5,2.8,1.4C43.1,31.9,43,32.2,42.7,32.5z"/>
    <circle cx="26" cy="26" r="3"/>
  </svg>
);

const PeriodontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 64 64" fill="currentColor" {...props}>
    <path d="M47,18c-0.3-2.9-2.8-5-5.8-5H22.8c-2.9,0-5.4,2.1-5.8,5H13v10h38V18H47z M22.8,15h18.4c1.7,0,3.1,1.2,3.3,2.8V26H19.5v-8.2C19.7,16.2,21.1,15,22.8,15z"/>
    <path d="M51,30H13c-1.1,0-2,0.9-2,2v18c0,1.1,0.9,2,2,2h38c1.1,0,2-0.9,2-2V32C53,30.9,52.1,30,51,30z M24,48h-4V36h4V48z M34,48h-4V36h4V48z M44,48h-4V36h4V48z"/>
  </svg>
);

const AbscessIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg viewBox="0 0 64 64" fill="currentColor" {...props}>
    <path d="M32,4C16.5,4,4,16.5,4,32s12.5,28,28,28s28-12.5,28-28S47.5,4,32,4z M32,50c-6.9,0-12.9-3.6-16.3-9h32.6C44.9,46.4,38.9,50,32,50z M44.2,37h-2.1c-0.8-2.7-2.1-5.2-3.8-7.2L40,28.2c0.8-0.8,0.8-2,0-2.8s-2-0.8-2.8,0l-1.7,1.7c-2-1.7-4.5-3-7.2-3.8V22c0-1.1-0.9-2-2-2s-2,0.9-2,2v2.1c-2.7,0.8-5.2,2.1-7.2,3.8L13.2,26c-0.8-0.8-2-0.8-2.8,0s-0.8,2,0,2.8l1.7,1.7c-1.7,2-3,4.5-3.8,7.2H6c-1.1,0-2,0.9-2,2c0,0.8,0.5,1.5,1.2,1.8C8.1,45.9,13.6,50,20,51.3V54c0,1.1,0.9,2,2,2h1c1.1,0,2-0.9,2-2v-2.7c0,0,0,0,0,0h2c0,0,0,0,0,0V54c0,1.1,0.9,2,2,2h1c1.1,0,2-0.9,2-2v-2.7c6.4-1.3,11.9-5.3,14.8-10.5c0.7-0.3,1.2-1,1.2-1.8C46.2,37.9,45.3,37,44.2,37z"/>
    <circle cx="32" cy="26" r="4" fill="#FF6B6B"/>
 </svg>
);


const conditionsData: DentalCondition[] = [
  {
    id: 'caries',
    name: 'Dental Caries',
    description: 'Detects cavities early, allowing for timely intervention before they progress, reducing the need for extensive treatments.',
    imageUrl: 'caries_icon', // Placeholder for SVG
  },
  {
    id: 'periodontal',
    name: 'Periodontal Disease',
    description: 'Identifies early signs of bone loss & gum disease, helping dentists manage & treat gum issues before they advance to more serious stages.',
    imageUrl: 'periodontal_icon',
  },
  {
    id: 'abscess',
    name: 'Periapical Abscess',
    description: 'Spots infections at the tooth root, allowing for prompt treatment and reducing the risk of the infection spreading.',
    imageUrl: 'abscess_icon',
  },
];

const ConditionCard: React.FC<{ condition: DentalCondition }> = ({ condition }) => {
  const renderIcon = () => {
    const iconProps = { className:"w-20 h-20 md:w-24 md:h-24 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" };
    if (condition.imageUrl === 'caries_icon') return <CariesIcon {...iconProps} />;
    if (condition.imageUrl === 'periodontal_icon') return <PeriodontalIcon {...iconProps} />;
    if (condition.imageUrl === 'abscess_icon') return <AbscessIcon {...iconProps} />;
    return null;
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-purple-600/40 hover:-translate-y-2 border border-slate-700/80 flex flex-col group">
      <div className="p-8 flex flex-col items-center text-center bg-slate-800/50 rounded-t-xl">
        <div className="mb-6 p-4 bg-slate-700/50 rounded-full shadow-lg">
           {renderIcon()}
        </div>
      </div>
      <div className="p-6 pt-0 flex flex-col flex-grow text-center">
        <h3 className="text-2xl font-display font-semibold text-purple-300 group-hover:text-purple-200 mb-3 transition-colors duration-300">{condition.name}</h3>
        <p className="text-slate-300/90 text-sm leading-relaxed flex-grow">{condition.description}</p>
      </div>
    </div>
  );
};


interface ConditionsSectionProps {
  id?: string;
}

export const ConditionsSection: React.FC<ConditionsSectionProps> = ({ id }) => {
  return (
    <section id={id} className="py-20 md:py-28 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
            Dental Conditions We Analyze
          </h2>
          <p className="mt-6 text-lg text-slate-300 max-w-3xl mx-auto">
            Our AI is trained to identify a range of dental issues from X-ray images, aiding in early detection and effective treatment planning for enhanced patient care.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {conditionsData.map((condition) => (
            <ConditionCard key={condition.id} condition={condition} />
          ))}
        </div>
      </div>
    </section>
  );
};
