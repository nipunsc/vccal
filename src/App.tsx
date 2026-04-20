/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { History, Equal, Plus, Minus, X, Divide, Percent } from 'lucide-react';

type Operator = '+' | '-' | '*' | '/' | null;

interface CalculationHistory {
  formula: string;
  result: string;
  timestamp: string;
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [history, setHistory] = useState<CalculationHistory[]>([]);

  const formatNumber = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return num;
    return n.toLocaleString('en-US', { maximumFractionDigits: 5 });
  };

  const calculate = useCallback((first: number, second: number, op: Operator): number => {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '*': return first * second;
      case '/': return second !== 0 ? first / second : 0;
      default: return second;
    }
  }, []);

  const handleNumber = useCallback((digit: string) => {
    setDisplay(prev => {
      if (isWaitingForNext) {
        setIsWaitingForNext(false);
        return digit;
      }
      return prev === '0' ? digit : prev + digit;
    });
  }, [isWaitingForNext]);

  const handleOperator = useCallback((nextOperator: Operator) => {
    const value = parseFloat(display);

    setPrevValue(prev => {
      if (prev === null) {
        setEquation(`${formatNumber(String(value))} ${nextOperator}`);
        return value;
      } else if (operator) {
        const result = calculate(prev, value, operator);
        setDisplay(String(result));
        setEquation(`${formatNumber(String(result))} ${nextOperator}`);
        return result;
      }
      return prev;
    });

    setIsWaitingForNext(true);
    setOperator(nextOperator);
  }, [display, operator, calculate]);

  const handleEqual = useCallback(() => {
    const value = parseFloat(display);
    if (operator && prevValue !== null) {
      const result = calculate(prevValue, value, operator);
      const formula = `${formatNumber(String(prevValue))} ${operator} ${formatNumber(String(value))}`;
      
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setHistory(prev => [
        { formula, result: String(result), timestamp },
        ...prev.slice(0, 9)
      ]);

      setDisplay(String(result));
      setPrevValue(null);
      setOperator(null);
      setEquation('');
      setIsWaitingForNext(true);
    }
  }, [display, operator, prevValue, calculate]);

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setPrevValue(null);
    setOperator(null);
    setIsWaitingForNext(false);
  };

  const handlePercent = () => {
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const handleToggleSign = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const handleBackspace = useCallback(() => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  }, []);

  const handleDecimal = useCallback(() => {
    setDisplay(prev => {
      if (isWaitingForNext) {
        setIsWaitingForNext(false);
        return '0.';
      }
      if (!prev.includes('.')) {
        return prev + '.';
      }
      return prev;
    });
  }, [isWaitingForNext]);

  const handleScientific = (op: string) => {
    const val = parseFloat(display);
    let result = 0;
    switch(op) {
      case 'sin': result = Math.sin(val); break;
      case 'cos': result = Math.cos(val); break;
      case 'tan': result = Math.tan(val); break;
      case 'log': result = Math.log10(val); break;
      case 'ln': result = Math.log(val); break;
      case '√': result = Math.sqrt(val); break;
      case 'π': setDisplay(String(Math.PI)); return;
      case 'e': setDisplay(String(Math.E)); return;
      case 'x!': {
        const fact = (n: number): number => n <= 1 ? 1 : n * fact(n - 1);
        result = fact(Math.floor(val));
        break;
      }
      default: return;
    }
    setDisplay(String(result.toFixed(8)).replace(/\.?0+$/, ""));
    setIsWaitingForNext(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/[0-9]/.test(e.key)) handleNumber(e.key);
      if (e.key === '+') handleOperator('+');
      if (e.key === '-') handleOperator('-');
      if (e.key === '*') handleOperator('*');
      if (e.key === '/') handleOperator('/');
      if (e.key === 'Enter' || e.key === '=') handleEqual();
      if (e.key === 'Escape') handleClear();
      if (e.key === 'Backspace') handleBackspace();
      if (e.key === '.') handleDecimal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleOperator, handleEqual, handleBackspace, handleDecimal]);

  const CalcButton = ({ 
    children, 
    onClick, 
    variant = 'default',
    span = 1,
    className = ""
  }: { 
    children: ReactNode; 
    onClick: () => void; 
    variant?: 'default' | 'operator' | 'action' | 'special';
    span?: number;
    className?: string;
  }) => {
    const variants = {
      default: 'bg-white/5 hover:bg-white/10 border-white/5 text-white',
      operator: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300',
      action: 'bg-white/5 hover:bg-white/10 border-white/5 text-pink-400',
      special: 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 hover:brightness-110 text-white border-transparent font-bold'
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
          flex h-full items-center justify-center rounded-2xl text-xl font-medium transition-all border
          ${variants[variant]}
          ${span === 2 ? 'col-span-2' : 'col-span-1'}
          ${className}
        `}
      >
        {children}
      </motion.button>
    );
  };

  return (
    <div className="flex h-screen items-center justify-center p-4 font-sans select-none overflow-hidden">
      <div className="frosted-bg" />
      
      <div className="relative w-full max-w-[1024px] flex gap-4 h-[768px] max-h-screen">
        
        {/* Left Sidebar: Scientific Mode */}
        <aside className="w-64 h-full glass-main rounded-[32px] p-6 flex flex-col hidden lg:flex">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Scientific Mode</h3>
          <div className="grid grid-cols-2 gap-3 flex-1 content-start">
            {['sin', 'cos', 'tan', 'log', 'ln', '√', 'π', 'e', 'xʸ', 'x!'].map((op) => (
              <button 
                key={op}
                onClick={() => handleScientific(op)}
                className="h-12 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
              >
                {op}
              </button>
            ))}
          </div>
          <div className="mt-auto pt-6">
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold mb-1">Tip</p>
              <p className="text-[11px] text-indigo-100/70 leading-relaxed">Keyboard shortcuts enabled for rapid calculation.</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-full flex flex-col gap-4">
          <section className="glass-display rounded-[32px] p-8 flex flex-col justify-end items-end h-[160px] relative overflow-hidden">
             <div className="absolute top-4 left-6 flex items-center gap-2 lg:hidden">
              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
            <div className="text-white/40 text-sm font-medium tracking-wide mb-1 font-mono">
              {equation || history[0]?.formula || 'No recent operation'}
            </div>
            <motion.div 
              key={display}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-light tracking-tight truncate max-w-full font-mono"
            >
              {formatNumber(display)}
            </motion.div>
          </section>

          <section className="flex-1 glass-input rounded-[32px] p-6 lg:p-8">
            <div className="grid grid-cols-4 h-full gap-4">
              <CalcButton variant="action" onClick={handleClear}>AC</CalcButton>
              <CalcButton variant="action" onClick={handleToggleSign}>+/-</CalcButton>
              <CalcButton variant="action" onClick={handlePercent}>%</CalcButton>
              <CalcButton variant="operator" onClick={() => handleOperator('/')}>
                <Divide size={24} />
              </CalcButton>

              <CalcButton onClick={() => handleNumber('7')}>7</CalcButton>
              <CalcButton onClick={() => handleNumber('8')}>8</CalcButton>
              <CalcButton onClick={() => handleNumber('9')}>9</CalcButton>
              <CalcButton variant="operator" onClick={() => handleOperator('*')}>
                <X size={24} />
              </CalcButton>

              <CalcButton onClick={() => handleNumber('4')}>4</CalcButton>
              <CalcButton onClick={() => handleNumber('5')}>5</CalcButton>
              <CalcButton onClick={() => handleNumber('6')}>6</CalcButton>
              <CalcButton variant="operator" onClick={() => handleOperator('-')}>
                <Minus size={24} />
              </CalcButton>

              <CalcButton onClick={() => handleNumber('1')}>1</CalcButton>
              <CalcButton onClick={() => handleNumber('2')}>2</CalcButton>
              <CalcButton onClick={() => handleNumber('3')}>3</CalcButton>
              <CalcButton variant="operator" onClick={() => handleOperator('+')}>
                <Plus size={24} />
              </CalcButton>

              <CalcButton span={2} onClick={() => handleNumber('0')} className="text-left px-8 justify-start">0</CalcButton>
              <CalcButton onClick={handleDecimal}>.</CalcButton>
              <CalcButton variant="special" onClick={handleEqual}>
                <Equal size={28} />
              </CalcButton>
            </div>
          </section>
        </main>

        {/* Right Sidebar: History */}
        <aside className="w-72 h-full glass-main rounded-[32px] p-6 flex flex-col hidden xl:flex">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6">Recent Calculations</h3>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="flex h-full items-center justify-center text-white/20 text-xs uppercase tracking-widest">
                History is empty
              </div>
            ) : (
              history.map((item, i) => (
                <div key={item.timestamp + i} className="group cursor-default">
                  <p className="text-[10px] text-white/30 mb-1 font-mono tracking-wider">{item.timestamp}</p>
                  <p className="text-xs text-white/60 mb-1 font-mono truncate">{item.formula}</p>
                  <p className="text-lg font-medium text-white/90 group-hover:text-pink-400 transition-colors font-mono tracking-tight">
                    {formatNumber(item.result)}
                  </p>
                  <div className="h-px bg-white/5 mt-4 group-last:hidden" />
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setHistory([])}
            className="mt-6 w-full py-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/40 transition-colors"
          >
            Clear History
          </button>
        </aside>

      </div>
    </div>
  );
}
