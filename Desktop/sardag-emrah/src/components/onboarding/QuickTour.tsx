/**
 * QUICK TOUR - First-time User Onboarding
 *
 * Simple tooltips for new users
 */

'use client';

import { useState, useEffect } from 'react';

export function QuickTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const steps = [
    {
      title: '🎉 Hoş Geldiniz!',
      message: 'UkalAI ile kripto piyasalarını analiz edin. 9 strateji + AI ile %93-95 başarı oranı!',
    },
    {
      title: '📊 Market Overview',
      message: '570+ kripto çifti + Altın, Gümüş, Platinum, BIST100 canlı takip edin.',
    },
    {
      title: '🚀 Scanner',
      message: 'STRONG_BUY sinyallerini otomatik bulun. Bildirimler ile kaçırmayın!',
    },
    {
      title: '✅ Hazırsınız!',
      message: 'Herhangi bir coin\'e tıklayarak detaylı analiz görebilirsiniz.',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem('hasSeenTour', 'true');
      setShow(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-blue-500/30">
        <h3 className="text-2xl font-bold text-white mb-2">
          {steps[step].title}
        </h3>
        <p className="text-gray-300 mb-6">{steps[step].message}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === step ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Atla
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              {step < steps.length - 1 ? 'İleri' : 'Başla'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
