
import React, { useState } from 'react';
import { APP_NAME } from '../constants';

interface FAQItemProps {
  question: string;
  answer: React.ReactNode; // Allow ReactNode for richer answer content
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-700/80">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full py-5 sm:py-6 text-left text-slate-200 hover:text-purple-300 focus:outline-none transition-colors duration-150"
        aria-expanded={isOpen}
      >
        <span className="text-lg md:text-xl font-display font-medium">{question}</span>
        {isOpen ? <ChevronUpIcon className="w-6 h-6 text-purple-400" /> : <ChevronDownIcon className="w-6 h-6 text-purple-400" />}
      </button>
      {isOpen && (
        <div className="pb-5 sm:pb-6 pr-4 text-slate-300/90 text-sm sm:text-base leading-relaxed space-y-2">
          {answer}
        </div>
      )}
    </div>
  );
};

export const FAQPage: React.FC = () => {
  const faqData: FAQItemProps[] = [
    {
      question: `What dental conditions can ${APP_NAME} help identify?`,
      answer: (
        <>
          <p>{APP_NAME} is designed to assist in identifying potential signs of common dental conditions such as:</p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>Dental Caries (Cavities)</li>
            <li>Periodontal Disease (Gum Disease, including bone loss)</li>
            <li>Periapical Abscesses (Infections at the tooth root)</li>
          </ul>
          <p className="mt-2">The AI provides an analysis based on the visual information in the X-ray. It's a tool to support, not replace, professional dental examination.</p>
        </>
      ),
    },
    {
      question: "Is the AI analysis 100% accurate?",
      answer: `No AI is 100% accurate. ${APP_NAME} uses advanced AI models to provide insights, but it should be used as a supplementary tool by dental professionals. All findings should be correlated with clinical examination and professional judgment. The AI's primary role is to highlight areas of potential concern for further review.`,
    },
    {
      question: "Who should use this application?",
      answer: `${APP_NAME} is designed for two main user groups:
        1.  **Dental Professionals (Dentists, Hygienists, Technicians):** To aid in X-ray review, patient education, and record keeping.
        2.  **Patients:** To get a preliminary understanding of their X-rays, which can facilitate more informed discussions with their dentists. Patients should always consult their dentist for diagnosis and treatment.`,
    },
    {
      question: "What kind of images can I upload?",
      answer: "You should upload dental X-ray images (e.g., bitewings, periapical, panoramic X-rays). The supported formats are typically JPEG, PNG, and WEBP. For best results, ensure the image is clear, well-lit, and properly focused. The system will attempt to identify if an uploaded image is not a dental X-ray.",
    },
    {
        question: "How does the 'visual overlay' feature work?",
        answer: `The AI can optionally provide coordinates for areas of concern (like cavities) or notable healthy areas. ${APP_NAME} then draws colored boxes (red for concerns, green for healthy highlights) on the X-ray image to visually guide you. This feature depends on the AI's ability to accurately identify and locate these regions.`,
    },
    {
        question: "What if I upload a non-dental image?",
        answer: `The AI is trained on dental X-rays. If you upload an image that is not a dental X-ray, the system will likely report that the image quality is 'Not a dental X-ray' and will not be able to perform a meaningful analysis of dental conditions.`,
    },
    {
        question: "How is my data handled?",
        answer: `For this demonstration version, user data (profile information, analysis history including uploaded images for logged-in users) is stored in your browser's local storage. No data is transmitted to a central server for storage beyond the temporary processing by the Gemini API. Please review our Privacy Policy for more details in a production version.`,
    }
  ];

  return (
    <div className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-extrabold text-center text-purple-300 mb-6 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-center text-lg text-slate-300/90 mb-12 md:mb-16 max-w-2xl mx-auto">
          Find answers to common questions about {APP_NAME}, dental conditions, and how our AI analysis works.
        </p>
        <div className="bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl border border-slate-700/80 p-6 sm:p-8 md:p-10">
          {faqData.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </div>
  );
};
