
import React from 'react';
import { APP_NAME } from '../constants.ts';

interface StatCardProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon }) => (
  <div className="bg-slate-800/70 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-xl text-center transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 border border-slate-700/80 hover:border-purple-600/60 group">
    {icon && <div className="text-purple-400 mb-5 text-5xl mx-auto flex justify-center group-hover:text-purple-300 transition-colors duration-300">{icon}</div>}
    <div className="text-5xl lg:text-6xl font-display font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">{value}</div>
    <div className="text-purple-300 text-base font-medium group-hover:text-purple-200 transition-colors duration-300">{label}</div>
  </div>
);

// Placeholder icons
const AccuracyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0012.75 9.75V5.625a3.375 3.375 0 00-3.375-3.375S6.375 2.25 6.375 5.625v4.125c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V5.625a2.25 2.25 0 012.25-2.25S15.75 3.375 15.75 5.625v4.125m0 0c0 .621.504 1.125 1.125 1.125h2.25c.621 0 1.125-.504 1.125-1.125V9.75A3.375 3.375 0 0012.75 6.375S9.375 6.375 9.375 9.75m0 0v4.5" /></svg>;
const EfficiencyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const HappyClientIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm4.5 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" /></svg>;

interface StatsSectionProps {
  id?: string;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ id }) => {
  const stats = [
    { value: '99%', label: 'Accuracy (Simulated)', icon: <AccuracyIcon /> },
    { value: '98%', label: 'Success Rate (Simulated)', icon: <SuccessIcon /> },
    { value: '2x', label: 'Efficiency Boost (Potential)', icon: <EfficiencyIcon /> },
    { value: '10K+', label: 'Happy Clients (Projected)', icon: <HappyClientIcon /> },
  ];

  return (
    <section id={id} className="py-20 md:py-28 bg-gradient-to-r from-purple-950/80 via-indigo-900/90 to-purple-950/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
            Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">{APP_NAME}</span>?
          </h2>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Leveraging cutting-edge AI for unparalleled dental insights and improved patient outcomes, {APP_NAME} is your partner in advancing dental care.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {stats.map((stat, index) => (
            <StatCard key={index} value={stat.value} label={stat.label} icon={stat.icon} />
          ))}
        </div>
      </div>
    </section>
  );
};
