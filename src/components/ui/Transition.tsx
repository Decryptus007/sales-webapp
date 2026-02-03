'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  enter?: string;
  enterFrom?: string;
  enterTo?: string;
  leave?: string;
  leaveFrom?: string;
  leaveTo?: string;
  duration?: number;
  className?: string;
  onEnter?: () => void;
  onEntered?: () => void;
  onLeave?: () => void;
  onLeft?: () => void;
}

export const Transition: React.FC<TransitionProps> = ({
  show,
  children,
  enter = 'transition-opacity duration-300',
  enterFrom = 'opacity-0',
  enterTo = 'opacity-100',
  leave = 'transition-opacity duration-300',
  leaveFrom = 'opacity-100',
  leaveTo = 'opacity-0',
  duration = 300,
  className,
  onEnter,
  onEntered,
  onLeave,
  onLeft,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsTransitioning(true);
      onEnter?.();

      // Small delay to ensure the element is rendered before applying enter classes
      const enterTimeout = setTimeout(() => {
        setIsTransitioning(false);
        onEntered?.();
      }, duration);

      return () => clearTimeout(enterTimeout);
    } else {
      setIsTransitioning(true);
      onLeave?.();

      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsTransitioning(false);
        onLeft?.();
      }, duration);

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [show, duration, onEnter, onEntered, onLeave, onLeft]);

  if (!isVisible) {
    return null;
  }

  const getTransitionClasses = () => {
    if (show) {
      return isTransitioning ? `${enter} ${enterFrom}` : `${enter} ${enterTo}`;
    } else {
      return isTransitioning ? `${leave} ${leaveTo}` : `${leave} ${leaveFrom}`;
    }
  };

  return (
    <div className={cn(getTransitionClasses(), className)}>
      {children}
    </div>
  );
};

// Fade transition component
export interface FadeTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
  onEnter?: () => void;
  onEntered?: () => void;
  onLeave?: () => void;
  onLeft?: () => void;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  show,
  children,
  duration = 300,
  className,
  onEnter,
  onEntered,
  onLeave,
  onLeft,
}) => {
  return (
    <Transition
      show={show}
      enter="transition-opacity ease-out"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity ease-in"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      duration={duration}
      className={className}
      onEnter={onEnter}
      onEntered={onEntered}
      onLeave={onLeave}
      onLeft={onLeft}
    >
      {children}
    </Transition>
  );
};

// Slide transition component
export interface SlideTransitionProps {
  show: boolean;
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  className?: string;
  onEnter?: () => void;
  onEntered?: () => void;
  onLeave?: () => void;
  onLeft?: () => void;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  show,
  children,
  direction = 'up',
  duration = 300,
  className,
  onEnter,
  onEntered,
  onLeave,
  onLeft,
}) => {
  const getSlideClasses = () => {
    switch (direction) {
      case 'up':
        return {
          enterFrom: 'translate-y-full opacity-0',
          enterTo: 'translate-y-0 opacity-100',
          leaveTo: 'translate-y-full opacity-0',
        };
      case 'down':
        return {
          enterFrom: '-translate-y-full opacity-0',
          enterTo: 'translate-y-0 opacity-100',
          leaveTo: '-translate-y-full opacity-0',
        };
      case 'left':
        return {
          enterFrom: 'translate-x-full opacity-0',
          enterTo: 'translate-x-0 opacity-100',
          leaveTo: 'translate-x-full opacity-0',
        };
      case 'right':
        return {
          enterFrom: '-translate-x-full opacity-0',
          enterTo: 'translate-x-0 opacity-100',
          leaveTo: '-translate-x-full opacity-0',
        };
      default:
        return {
          enterFrom: 'translate-y-full opacity-0',
          enterTo: 'translate-y-0 opacity-100',
          leaveTo: 'translate-y-full opacity-0',
        };
    }
  };

  const slideClasses = getSlideClasses();

  return (
    <Transition
      show={show}
      enter="transition-all ease-out"
      enterFrom={slideClasses.enterFrom}
      enterTo={slideClasses.enterTo}
      leave="transition-all ease-in"
      leaveFrom={slideClasses.enterTo}
      leaveTo={slideClasses.leaveTo}
      duration={duration}
      className={className}
      onEnter={onEnter}
      onEntered={onEntered}
      onLeave={onLeave}
      onLeft={onLeft}
    >
      {children}
    </Transition>
  );
};

// Scale transition component
export interface ScaleTransitionProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number;
  className?: string;
  onEnter?: () => void;
  onEntered?: () => void;
  onLeave?: () => void;
  onLeft?: () => void;
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  show,
  children,
  duration = 300,
  className,
  onEnter,
  onEntered,
  onLeave,
  onLeft,
}) => {
  return (
    <Transition
      show={show}
      enter="transition-all ease-out"
      enterFrom="scale-95 opacity-0"
      enterTo="scale-100 opacity-100"
      leave="transition-all ease-in"
      leaveFrom="scale-100 opacity-100"
      leaveTo="scale-95 opacity-0"
      duration={duration}
      className={className}
      onEnter={onEnter}
      onEntered={onEntered}
      onLeave={onLeave}
      onLeft={onLeft}
    >
      {children}
    </Transition>
  );
};

// Staggered list transition
export interface StaggeredTransitionProps {
  show: boolean;
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export const StaggeredTransition: React.FC<StaggeredTransitionProps> = ({
  show,
  children,
  staggerDelay = 100,
  className,
}) => {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="transition-all"
          style={{
            transitionDelay: show ? `${index * staggerDelay}ms` : '0ms',
          }}
        >
          <FadeTransition
            show={show}
            duration={300}
          >
            {child}
          </FadeTransition>
        </div>
      ))}
    </div>
  );
};

// Loading state transition wrapper
export interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export const LoadingTransition: React.FC<LoadingTransitionProps> = ({
  isLoading,
  children,
  loadingComponent,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      <FadeTransition show={!isLoading}>
        {children}
      </FadeTransition>

      <FadeTransition show={isLoading}>
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          {loadingComponent || (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          )}
        </div>
      </FadeTransition>
    </div>
  );
};