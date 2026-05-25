import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, X, Info, ShieldAlert } from 'lucide-react';
import { NotificationToast } from '../types';

interface ToastContainerProps {
  toasts: NotificationToast[];
  removeToast: (id: string) => void;
}

export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div 
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full"
      id="hcg-toast-container"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = 'bg-slate-900 border-slate-700';
          let textColor = 'text-slate-100';
          let Icon = Info;
          let iconColor = 'text-blue-400';

          if (toast.type === 'success') {
            bgColor = 'bg-[#14532d] border-[#166534]';
            textColor = 'text-slate-100';
            Icon = CheckCircle;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error') {
            bgColor = 'bg-[#7f1d1d] border-[#991b1b]';
            textColor = 'text-slate-100';
            Icon = ShieldAlert;
            iconColor = 'text-red-400';
          } else if (toast.type === 'warning') {
            bgColor = 'bg-[#78350f] border-[#92400e]';
            textColor = 'text-slate-100';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl border shadow-lg flex items-start gap-3 ${bgColor} ${textColor}`}
              id={`toast-${toast.id}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor} mt-0.5`} />
              <div className="flex-1 text-sm font-medium pr-2">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                aria-label="Cerrar notificación"
                id={`close-toast-${toast.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
