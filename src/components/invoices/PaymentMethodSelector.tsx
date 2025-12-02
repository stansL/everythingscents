'use client';

import React from 'react';
import { PaymentProvider } from '@/lib/services/payments/types';
import { paymentService } from '@/lib/services/payments/paymentService';

interface PaymentMethodSelectorProps {
  phoneNumber?: string;
  email?: string;
  onMethodSelect: (provider: PaymentProvider) => void;
  selectedProvider?: PaymentProvider;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  phoneNumber,
  email,
  onMethodSelect,
  selectedProvider,
  className = '',
}) => {
  const availableProviders = paymentService.getAvailableProviders();
  const suggestedProvider = paymentService.suggestProvider(phoneNumber, email);

  if (availableProviders.length === 0) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg ${className}`}>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          No payment providers are configured. Please contact support.
        </p>
      </div>
    );
  }

  const providerConfig = {
    [PaymentProvider.MPESA]: {
      name: 'M-Pesa',
      description: 'Pay via M-Pesa (Safaricom)',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" fill="#00A651"/>
          <text x="24" y="28" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">M</text>
        </svg>
      ),
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      selectedColor: 'ring-2 ring-green-600',
      textColor: 'text-green-900 dark:text-green-100',
      available: phoneNumber?.startsWith('254') && (
        phoneNumber.startsWith('25470') ||
        phoneNumber.startsWith('25471') ||
        phoneNumber.startsWith('25472') ||
        phoneNumber.startsWith('25474') ||
        phoneNumber.startsWith('25479')
      ),
    },
    [PaymentProvider.AIRTEL_MONEY]: {
      name: 'Airtel Money',
      description: 'Pay via Airtel Money',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" fill="#ED1C24"/>
          <text x="24" y="28" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">A</text>
        </svg>
      ),
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30',
      selectedColor: 'ring-2 ring-red-600',
      textColor: 'text-red-900 dark:text-red-100',
      available: phoneNumber?.startsWith('254') && (
        phoneNumber.startsWith('25473') ||
        phoneNumber.startsWith('25478')
      ),
    },
    [PaymentProvider.PAYSTACK]: {
      name: 'Card Payment',
      description: 'Pay with Visa, Mastercard, or Bank',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="12" width="40" height="24" rx="3" fill="#4F46E5"/>
          <rect x="4" y="20" width="40" height="4" fill="#312E81"/>
          <rect x="8" y="26" width="8" height="4" rx="1" fill="#E0E7FF"/>
        </svg>
      ),
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      hoverColor: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
      selectedColor: 'ring-2 ring-indigo-600',
      textColor: 'text-indigo-900 dark:text-indigo-100',
      available: true, // Card payments always available
    },
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Select Payment Method
        </h3>
        {suggestedProvider && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            {providerConfig[suggestedProvider].name} Recommended
          </span>
        )}
      </div>

      <div className="grid gap-3">
        {availableProviders.map((provider) => {
          const config = providerConfig[provider];
          const isSelected = selectedProvider === provider;
          const isSuggested = suggestedProvider === provider;
          const isAvailableForNumber = config.available !== false;

          return (
            <button
              key={provider}
              type="button"
              onClick={() => onMethodSelect(provider)}
              disabled={!isAvailableForNumber}
              className={`
                relative flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200
                ${config.bgColor}
                ${config.borderColor}
                ${isSelected ? config.selectedColor : ''}
                ${isAvailableForNumber ? config.hoverColor + ' cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                ${isSuggested && !isSelected ? 'ring-1 ring-blue-400' : ''}
              `}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-semibold ${config.textColor}`}>
                    {config.name}
                  </h4>
                  {isSuggested && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                      Suggested
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {config.description}
                </p>
                {!isAvailableForNumber && provider !== PaymentProvider.PAYSTACK && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Not available for this phone number
                  </p>
                )}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> For M-Pesa and Airtel Money, you&apos;ll receive a payment prompt on your phone. 
          For card payments, you&apos;ll be redirected to a secure checkout page.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
