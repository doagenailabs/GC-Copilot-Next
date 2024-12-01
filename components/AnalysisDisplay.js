'use client'

import { useState, useEffect } from 'react';

export default function AnalysisDisplay() {
    const [analysis, setAnalysis] = useState('');

    useEffect(() => {
        // Expose the display function globally
        window.displayAnalysis = (text) => {
            setAnalysis(prev => prev + text);
        };

        return () => {
            window.displayAnalysis = undefined;
        };
    }, []);

    return (
        <div className="fixed right-0 top-0 w-96 h-screen bg-white shadow-lg p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Real-time Analysis</h2>
            <div className="whitespace-pre-wrap">
                {analysis}
            </div>
        </div>
    );
}
