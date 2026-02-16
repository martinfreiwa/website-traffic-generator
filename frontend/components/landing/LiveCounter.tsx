import React, { useState, useEffect } from 'react';

interface LiveCounterProps {
    initialCount?: number;
    className?: string;
}

const LiveCounter: React.FC<LiveCounterProps> = ({ initialCount = 12403, className = '' }) => {
    const [count, setCount] = useState(initialCount);
    const [displayCount, setDisplayCount] = useState(initialCount);

    useEffect(() => {
        const interval = setInterval(() => {
            const change = Math.floor(Math.random() * 25) - 10;
            setCount(prev => Math.max(10000, prev + change));
        }, 3000 + Math.random() * 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const duration = 500;
        const steps = 20;
        const diff = count - displayCount;
        const stepValue = diff / steps;
        let currentStep = 0;

        const animate = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                setDisplayCount(count);
                clearInterval(animate);
            } else {
                setDisplayCount(prev => Math.round(prev + stepValue));
            }
        }, duration / steps);

        return () => clearInterval(animate);
    }, [count]);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-bold text-gray-600">
                <span className="text-gray-900">{displayCount.toLocaleString()}</span> active visitors
            </span>
        </div>
    );
};

export default LiveCounter;
