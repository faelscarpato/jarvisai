import * as React from 'react';
import { useJarvisStore } from '../../store';
import { Check, ShoppingCart } from 'lucide-react';

export const ShoppingSurface: React.FC = () => {
  const { shoppingList, toggleShoppingItem } = useJarvisStore();

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
                <ShoppingCart className="text-orange-400 w-6 h-6" />
            </div>
            <h2 className="text-xl font-medium tracking-wide">Lista de Compras</h2>
        </div>
        <span className="text-sm text-gray-400">{shoppingList.length} itens</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {shoppingList.map((item) => (
          <div 
            key={item.id}
            onClick={() => toggleShoppingItem(item.id)}
            className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer
              ${item.checked 
                ? 'bg-white/5 border-transparent opacity-50' 
                : 'bg-white/10 border-white/10 hover:bg-white/15'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                 ${item.checked ? 'bg-orange-500 border-orange-500' : 'border-gray-500 group-hover:border-orange-400'}
              `}>
                {item.checked && <Check className="w-3.5 h-3.5 text-black" />}
              </div>
              <div className="flex flex-col">
                <span className={`text-base ${item.checked ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                    {item.name}
                </span>
                {item.priceEstimate && !item.checked && (
                    <span className="text-xs text-orange-400/80">Est. {item.priceEstimate}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-gray-500">
        <span>Sincronizado com Google Keep</span>
        <span>Total Est: R$ 40,50</span>
      </div>
    </div>
  );
};