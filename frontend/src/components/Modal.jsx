import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ titulo, descricao, aoFechar, largo = false, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className={`relative my-6 w-full rounded-[28px] bg-fundo p-7 ${largo ? 'max-w-3xl' : 'max-w-[640px]'}`}>
        <button className="absolute right-5 top-5 rounded-full p-1.5 hover:bg-verde-claro" aria-label="Fechar" onClick={aoFechar}><X size={20} /></button>
        <h2 className="pr-8 text-2xl">{titulo}</h2>
        {descricao && <p className="mt-1 text-suave">{descricao}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
