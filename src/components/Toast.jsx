import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';












export const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const bgClass = {
            success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900/50',
            error: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-900/50',
            warning: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-900/50',
            info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-900/50'
          }[toast.type];

          const Icon = {
            success: CheckCircle,
            error: XCircle,
            warning: AlertTriangle,
            info: Info
          }[toast.type];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg pointer-events-auto ${bgClass} glass-panel`}>
              
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm font-medium pr-2">{toast.message}</div>
              <button
                onClick={() => onClose(toast.id)}
                className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                
                <X className="w-4 h-4" />
              </button>
            </motion.div>);

        })}
      </AnimatePresence>
    </div>);

};

// Global Toast emitter state hooks
let toastIdCounter = 0;
let toastListeners = [];
let activeToasts = [];

export const toast = {
  add: (message, type = 'success', duration = 4000) => {
    const id = `toast-${toastIdCounter++}`;
    const newToast = { id, message, type };
    activeToasts = [...activeToasts, newToast];
    toastListeners.forEach((listener) => listener(activeToasts));

    setTimeout(() => {
      toast.remove(id);
    }, duration);
  },
  remove: (id) => {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(activeToasts));
  },
  subscribe: (listener) => {
    toastListeners.push(listener);
    listener(activeToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }
};