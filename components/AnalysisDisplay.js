'use client'

import { useState, useEffect } from 'react';
import { subscribeToAnalysis, getCurrentAnalysis } from '@/lib/analysisStore';

export default function AnalysisDisplay() {
    const [analysis, setAnalysis] = useState(getCurrentAnalysis());

    useEffect(() => {
        // Subscribe to analysis updates
        const unsubscribe = subscribeToAnalysis((newAnalysis) => {
            setAnalysis(newAnalysis);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <div className="fixed right-0 top-0 w-96 h-screen bg-white shadow-lg overflow-hidden">
            <div className="p-4 h-full flex flex-col">
                <h2 className="text-xl font-bold mb-4 flex-shrink-0">Real-time Analysis</h2>
                
                {/* Scrollable content area */}
                <div className="flex-grow overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                        {analysis.split('\n').map((paragraph, index) => (
                            <p key={index} className="mb-2">
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
