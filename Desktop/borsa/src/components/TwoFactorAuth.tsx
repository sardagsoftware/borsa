'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, Smartphone, Key, Check, AlertCircle, Copy, CheckCircle } from 'lucide-react';

interface TwoFactorAuthProps {
  onComplete: (code: string) => void;
  onCancel?: () => void;
}

export function TwoFactorAuth({ onComplete, onCancel }: TwoFactorAuthProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Take only last digit
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('');

    setCode([
      newCode[0] || '',
      newCode[1] || '',
      newCode[2] || '',
      newCode[3] || '',
      newCode[4] || '',
      newCode[5] || ''
    ]);

    if (newCode.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (fullCode: string) => {
    setIsVerifying(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validate code (in production, this would be server-side)
      if (fullCode === '123456') {
        onComplete(fullCode);
      } else {
        setError('Invalid code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Two-Factor Authentication
            </h2>
            <p className="text-slate-400 text-sm">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {/* Code Input */}
          <div className="flex gap-3 mb-6 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all ${
                  digit
                    ? 'border-emerald-500 bg-emerald-500/10 text-white'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400'
                } focus:outline-none focus:border-emerald-500 focus:bg-emerald-500/20 disabled:opacity-50`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerify(code.join(''))}
            disabled={code.join('').length !== 6 || isVerifying}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Verify Code
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">or</span>
            </div>
          </div>

          {/* Alternative Options */}
          <div className="space-y-3">
            <button className="w-full py-2.5 border border-slate-700 text-slate-400 font-medium rounded-lg hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2">
              <Smartphone className="w-4 h-4" />
              Use SMS Code
            </button>
            <button className="w-full py-2.5 border border-slate-700 text-slate-400 font-medium rounded-lg hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2">
              <Key className="w-4 h-4" />
              Use Backup Code
            </button>
          </div>

          {/* Cancel */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full mt-4 py-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Don't have access to your authenticator?{' '}
          <a href="/support" className="text-emerald-400 hover:text-emerald-300">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

// 2FA Setup Component
export function TwoFactorSetup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [qrCode] = useState('JBSWY3DPEHPK3PXP'); // Example secret
  const [backupCodes] = useState([
    '8F7A-2C9D',
    '3B4E-1A6F',
    '9D2C-4E7B',
    '1F6A-8C3D',
    '7E2B-9F4A'
  ]);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 gap-2">
            {[1, 2, 3].map(num => (
              <div
                key={num}
                className={`flex items-center ${num < 3 ? 'flex-1' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= num
                    ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {step > num ? <Check className="w-5 h-5" /> : num}
                </div>
                {num < 3 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step > num ? 'bg-emerald-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Install App */}
          {step === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Install Authenticator App
              </h2>
              <p className="text-slate-400 mb-8">
                Download and install one of these authenticator apps
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer">
                  <h3 className="font-semibold text-white mb-1">Google Authenticator</h3>
                  <p className="text-slate-400 text-sm">iOS & Android</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer">
                  <h3 className="font-semibold text-white mb-1">Microsoft Authenticator</h3>
                  <p className="text-slate-400 text-sm">iOS & Android</p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Scan QR Code */}
          {step === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Scan QR Code
              </h2>
              <p className="text-slate-400 mb-8">
                Open your authenticator app and scan this QR code
              </p>
              <div className="inline-block p-6 bg-white rounded-xl mb-6">
                <div className="w-48 h-48 bg-slate-200 flex items-center justify-center">
                  {/* QR Code placeholder */}
                  <p className="text-slate-600 text-sm">QR Code</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                <p className="text-slate-400 text-sm mb-2">Or enter this code manually:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-emerald-400 font-mono">{qrCode}</code>
                  <button
                    onClick={() => copyToClipboard(qrCode)}
                    className="p-2 hover:bg-slate-700 rounded transition-colors"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 3 && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Save Backup Codes
              </h2>
              <p className="text-slate-400 mb-8">
                Store these codes in a safe place. You can use them to access your account if you lose your phone.
              </p>
              <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                      <code className="text-emerald-400 font-mono">{code}</code>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="w-full py-3 mb-3 border border-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy All Codes
              </button>
              <button
                onClick={onComplete}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}