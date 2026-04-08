import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepperStep {
  number: number;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

export function Stepper({ steps, currentStep, completedSteps, className }: StepperProps) {
  return (
    <div className={cn('flex items-start', className)} role="list" aria-label="Étapes de progression">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.number);
        const isCurrent = step.number === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.number}>
            <div
              className="flex flex-col items-center gap-1.5 min-w-0"
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 flex-shrink-0 transition-colors',
                  isCompleted
                    ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
                    : isCurrent
                    ? 'bg-[var(--primary-light,#eff6ff)] border-[var(--primary)] text-[var(--primary)]'
                    : 'bg-[var(--neutral-100)] border-[var(--border-color)] text-[var(--neutral-400)]'
                )}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : step.number}
              </div>
              <span
                className={cn(
                  'text-xs font-medium text-center leading-tight px-1',
                  isCurrent
                    ? 'text-[var(--primary)]'
                    : isCompleted
                    ? 'text-[var(--neutral-600)]'
                    : 'text-[var(--neutral-400)]'
                )}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'flex-1 h-0.5 mt-4 mx-1 transition-colors',
                  isCompleted ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
