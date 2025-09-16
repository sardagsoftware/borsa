'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Shield, CheckCircle, AlertCircle, Bot, Brain, RefreshCw } from 'lucide-react';

interface CaptchaArrowStepperProps {
  onComplete: (success: boolean, data?: any) => void;
  onStepChange?: (step: number) => void;
  onClose?: () => void;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

interface StepData {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'intro' | 'challenge' | 'verification' | 'complete';
  required?: boolean;
}

const CaptchaArrowStepper: React.FC<CaptchaArrowStepperProps> = ({
  onComplete,
  onStepChange,
  onClose,
  disabled = false,
  theme = 'dark',
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationState, setVerificationState] = useState<'pending' | 'success' | 'failed'>('pending');
  const [challengeData, setChallengeData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedButton, setFocusedButton] = useState<'prev' | 'next' | null>(null);

  const steps: StepData[] = [
    {
      id: 0,
      title: 'Güvenlik Doğrulaması',
      description: 'Bot olmadığınızı doğrulamak için güvenlik kontrolü',
      icon: <Shield className="w-6 h-6" />,
      type: 'intro'
    },
    {
      id: 1, 
      title: 'Güvenlik Kontrolü',
      description: 'Lütfen aşağıdaki adımları tamamlayın',
      icon: <Brain className="w-6 h-6" />,
      type: 'challenge',
      required: true
    },
    {
      id: 2,
      title: 'Doğrulama',
      description: 'Güvenlik kontrolünüz işleniyor...',
      icon: <RefreshCw className="w-6 h-6" />,
      type: 'verification'
    },
    {
      id: 3,
      title: 'Tamamlandı',
      description: 'Güvenlik doğrulaması başarıyla tamamlandı',
      icon: <CheckCircle className="w-6 h-6" />,
      type: 'complete'
    }
  ];

  const canNavigateNext = useCallback(() => {
    if (disabled) return false;
    if (currentStep >= steps.length - 1) return false;
    
    const currentStepData = steps[currentStep];
    if (currentStepData.required && !completedSteps.has(currentStep)) {
      return false;
    }
    
    return true;
  }, [currentStep, steps.length, completedSteps, disabled]);

  const canNavigatePrev = useCallback(() => {
    if (disabled) return false;
    return currentStep > 0;
  }, [currentStep, disabled]);

  const handleNext = useCallback(() => {
    if (!canNavigateNext()) return;
    
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    onStepChange?.(nextStep);

    // Auto-trigger verification on verification step
    if (steps[nextStep]?.type === 'verification') {
      setTimeout(() => {
        performVerification();
      }, 1000);
    }
  }, [currentStep, canNavigateNext, onStepChange]);

  const handlePrev = useCallback(() => {
    if (!canNavigatePrev()) return;
    
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    onStepChange?.(prevStep);
  }, [currentStep, canNavigatePrev, onStepChange]);

  const performVerification = async () => {
    setIsVerifying(true);
    setVerificationState('pending');

    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark verification as successful
      setVerificationState('success');
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      // Auto-proceed to final step
      setTimeout(() => {
        if (currentStep + 1 < steps.length) {
          handleNext();
        }
        onComplete(true, { challengeId: challengeData?.id || 'captcha_' + Date.now() });
      }, 1500);
      
    } catch (error) {
      setVerificationState('failed');
      onComplete(false, { error: 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChallengeComplete = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setChallengeData({ id: 'challenge_' + Date.now(), completed: true });
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (canNavigatePrev()) {
            handlePrev();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (canNavigateNext()) {
            handleNext();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedButton === 'next' && canNavigateNext()) {
            handleNext();
          } else if (focusedButton === 'prev' && canNavigatePrev()) {
            handlePrev();
          }
          break;
        case 'Tab':
          // Let default tab behavior handle focus
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, canNavigateNext, canNavigatePrev, focusedButton, disabled]);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div 
      ref={containerRef}
      className={`relative bg-panel/90 backdrop-blur-sm border border-glass/30 rounded-xl p-6 shadow-2xl ${className}`}
      role="region"
      aria-label="CAPTCHA güvenlik doğrulaması"
      tabIndex={-1}
    >
      {/* Header with Close Button */}
      {onClose && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-1" />
            <span className="text-white font-medium text-sm">Güvenlik Doğrulaması</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors p-1 rounded hover:bg-bg/50"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-brand-1 border-brand-1 text-white scale-110'
                    : completedSteps.has(index)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-bg border-glass text-muted'
                }`}
                aria-label={`Adım ${index + 1}: ${step.title}`}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 transition-colors duration-300 ${
                    completedSteps.has(index) ? 'bg-green-500' : 'bg-glass'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="text-center mb-6 min-h-[120px] flex flex-col justify-center">
        <div className="mb-4 flex justify-center">
          <div className={`p-3 rounded-full ${
            currentStepData.type === 'verification' && isVerifying
              ? 'bg-blue-500/20 text-blue-400 animate-spin'
              : currentStepData.type === 'complete'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-brand-1/20 text-brand-1'
          }`}>
            {currentStepData.icon}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          {currentStepData.title}
        </h3>
        
        <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto">
          {currentStepData.description}
        </p>

        {/* Step-specific content */}
        {currentStepData.type === 'challenge' && (
          <div className="mt-4 space-y-3">
            <button
              onClick={handleChallengeComplete}
              disabled={completedSteps.has(currentStep)}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                completedSteps.has(currentStep)
                  ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                  : 'bg-brand-1 hover:bg-brand-1/80 text-white hover:scale-105'
              }`}
              aria-label="Güvenlik kontrolünü tamamla"
            >
              {completedSteps.has(currentStep) ? (
                <><CheckCircle className="w-4 h-4 inline mr-2" />Tamamlandı</>
              ) : (
                <><Bot className="w-4 h-4 inline mr-2" />İnsan Doğrulaması</>
              )}
            </button>
          </div>
        )}

        {currentStepData.type === 'verification' && (
          <div className="mt-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm ${
              verificationState === 'success' 
                ? 'bg-green-500/20 text-green-400'
                : verificationState === 'failed'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {verificationState === 'success' ? (
                <><CheckCircle className="w-4 h-4 mr-2" />Doğrulandı</>
              ) : verificationState === 'failed' ? (
                <><AlertCircle className="w-4 h-4 mr-2" />Başarısız</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Doğrulanıyor...</>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrev}
          onFocus={() => setFocusedButton('prev')}
          onBlur={() => setFocusedButton(null)}
          disabled={!canNavigatePrev()}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-brand-1 focus:outline-none ${
            canNavigatePrev()
              ? 'bg-bg border border-glass text-white hover:bg-glass hover:scale-105'
              : 'bg-bg/50 border border-glass/50 text-muted/50 cursor-not-allowed'
          }`}
          aria-label="Önceki adım"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Geri
        </button>

        <div className="text-xs text-muted">
          {currentStep + 1} / {steps.length}
        </div>

        <button
          onClick={handleNext}
          onFocus={() => setFocusedButton('next')}
          onBlur={() => setFocusedButton(null)}
          disabled={!canNavigateNext() || isLastStep}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-brand-1 focus:outline-none ${
            canNavigateNext() && !isLastStep
              ? 'bg-brand-1 text-white hover:bg-brand-1/80 hover:scale-105'
              : 'bg-bg/50 border border-glass/50 text-muted/50 cursor-not-allowed'
          }`}
          aria-label="Sonraki adım"
        >
          İleri
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Accessibility Instructions */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Adım ${currentStep + 1} / ${steps.length}: ${currentStepData.title}. ${currentStepData.description}`}
      </div>

      {/* No-JS Fallback */}
      <noscript>
        <div className="absolute inset-0 bg-panel/95 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="text-center p-6">
            <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <p className="text-white font-medium mb-2">JavaScript Gerekli</p>
            <p className="text-muted text-sm">
              Güvenlik doğrulaması için JavaScript'i etkinleştirmeniz gerekmektedir.
            </p>
          </div>
        </div>
      </noscript>
    </div>
  );
};

export default CaptchaArrowStepper;
