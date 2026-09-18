
import React from 'react';
import { Testimonial } from '../types';
import { APP_NAME } from '../constants'; 

const testimonialsData: Testimonial[] = [
  {
    id: '1',
    quote: "Dentalyze Care has transformed our diagnostic process. The AI-driven insights provide a level of accuracy we've never had before. Detecting conditions early and analyzing each case in detail has been a game-changer for our practice.",
    author: 'Dr. Evelyn Reed',
    role: 'Dental Professional',
    avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    id: '2',
    quote: "The tailored analysis helps us personalize treatment plans with confidence. It's intuitive, reliable, and fits seamlessly into our workflow, enhancing patient care without adding complexity. Highly recommended!",
    author: 'Muhammad Asad',
    role: 'Dental Technician',
    avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
   {
    id: '3',
    quote: "Using this tool has significantly sped up our preliminary checks, allowing us to focus more on complex cases. The visual aids and clear reports are fantastic for patient communication.",
    author: 'Dr. Ken Adams',
    role: 'Clinic Owner',
    avatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => (
  <div className="bg-slate-800/70 backdrop-blur-sm p-8 rounded-xl shadow-xl flex flex-col items-center text-center h-full border border-slate-700/80 transform transition-all duration-300 hover:shadow-purple-600/40 hover:border-purple-600/70 hover:-translate-y-1.5 group">
    {testimonial.avatarUrl && (
      <img
        className="w-24 h-24 rounded-full mb-6 border-4 border-purple-500/80 shadow-lg group-hover:border-purple-400 transition-all duration-300"
        src={testimonial.avatarUrl}
        alt={testimonial.author}
      />
    )}
    <p className="text-slate-300/90 italic text-md leading-relaxed mb-6 flex-grow group-hover:text-slate-200 transition-colors duration-300">"{testimonial.quote}"</p>
    <div className="mt-auto">
      <h4 className="text-xl font-display font-semibold text-white group-hover:text-purple-200 transition-colors duration-300">{testimonial.author}</h4>
      <p className="text-sm text-purple-400 font-medium group-hover:text-purple-300 transition-colors duration-300">{testimonial.role}</p>
    </div>
  </div>
);


export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-r from-indigo-900/90 via-purple-950/90 to-indigo-900/90">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
            Transforming Diagnostics: Hear From Our Users
          </h2>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover how {APP_NAME} is making a difference in dental practices worldwide, empowering professionals with actionable AI insights.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {testimonialsData.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};
