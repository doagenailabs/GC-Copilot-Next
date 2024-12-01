import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, UserCircle, PhoneCall, MessageSquare } from 'lucide-react';
import { subscribeToAnalysis } from '@/lib/analysisStore';
import { subscribeToTranscriptions } from '@/lib/transcriptionStore';

const getScoreColor = (score, type = 'standard') => {
  // Different color scales for different metrics
  const scales = {
    standard: {
      critical: 'bg-red-100 border-l-4 border-red-500 text-red-700',
      poor: 'bg-orange-100 border-l-4 border-orange-500 text-orange-700',
      fair: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
      good: 'bg-emerald-100 border-l-4 border-emerald-500 text-emerald-700',
      excellent: 'bg-green-100 border-l-4 border-green-500 text-green-700'
    },
    sentiment: {
      negative: 'bg-red-100 border-l-4 border-red-500 text-red-700',
      mixed: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
      neutral: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700',
      positive: 'bg-green-100 border-l-4 border-green-500 text-green-700'
    },
    urgency: {
      critical: 'bg-red-100 border-l-4 border-red-500 text-red-700',
      high: 'bg-orange-100 border-l-4 border-orange-500 text-orange-700',
      medium: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
      low: 'bg-green-100 border-l-4 border-green-500 text-green-700'
    }
  };

  if (type === 'sentiment') return scales.sentiment[score];
  if (type === 'urgency') return scales.urgency[score];
  
  // For numerical scores
  if (typeof score === 'number') {
    if (score <= 3) return scales.standard.critical;
    if (score <= 5) return scales.standard.poor;
    if (score <= 7) return scales.standard.fair;
    if (score <= 8.5) return scales.standard.good;
    return scales.standard.excellent;
  }
  
  return scales.standard.fair;
};

const MetricCard = ({ label, value, type = 'standard', icon: Icon }) => (
  <div className={`p-4 rounded-lg ${getScoreColor(value, type)}`}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      {Icon && <Icon className="w-4 h-4 opacity-70" />}
    </div>
    <div className="mt-1 font-bold">
      {typeof value === 'number' ? value.toFixed(1) : value}
    </div>
  </div>
);

const AlertList = ({ items, label }) => items && items.length > 0 && (
  <div className="mb-2">
    <div className="text-xs font-medium text-gray-500 mb-1">{label}</div>
    <div className="space-y-1">
      {items.map((item, idx) => (
        <div key={idx} className={`text-xs p-2 rounded-md ${getScoreColor('fair')}`}>
          {item}
        </div>
      ))}
    </div>
  </div>
);

const TranscriptionView = ({ transcripts }) => (
  <Card className="border-gray-200 mb-4">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-700">Live Transcription</h3>
        <MessageSquare className="w-4 h-4 text-gray-500" />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {transcripts.map((transcript, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg text-sm ${
              transcript.channel === 'EXTERNAL'
                ? 'bg-blue-50 text-blue-700 ml-4'
                : 'bg-gray-50 text-gray-700 mr-4'
            }`}
          >
            <div className="font-medium text-xs mb-1">
              {transcript.channel === 'EXTERNAL' ? 'Customer' : 'Agent'}
            </div>
            {transcript.text}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function AnalysisDisplay() {
  const [analysis, setAnalysis] = useState(null);
  const [transcripts, setTranscripts] = useState([]);

  useEffect(() => {
    const unsubscribeAnalysis = subscribeToAnalysis((newAnalysisStr) => {
      try {
        const parsedAnalysis = JSON.parse(newAnalysisStr);
        setAnalysis(parsedAnalysis);
      } catch (e) {
        console.error('Failed to parse analysis:', e);
      }
    });

    const unsubscribeTranscriptions = subscribeToTranscriptions((newTranscripts) => {
      setTranscripts(newTranscripts);
    });

    return () => {
      unsubscribeAnalysis();
      unsubscribeTranscriptions();
    };
  }, []);

  if (!analysis) {
    return (
      <div className="fixed right-0 top-0 w-96 h-screen bg-white shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const { customer_analysis, agent_performance, interaction_quality, business_intelligence } = analysis;

  return (
    <div className="fixed right-0 top-0 w-96 h-screen bg-white shadow-lg">
      <div className="h-full overflow-y-auto p-4 space-y-4">
        {/* Live Transcription Section */}
        <TranscriptionView transcripts={transcripts} />

        {/* Critical Metrics - Most important KPIs at the top */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard 
            label="Customer Sentiment" 
            value={customer_analysis.sentiment}
            type="sentiment"
            icon={UserCircle}
          />
          <MetricCard 
            label="Urgency Level" 
            value={customer_analysis.urgency_level}
            type="urgency"
            icon={AlertCircle}
          />
        </div>

        {/* Agent Performance Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricCard 
            label="Response Quality" 
            value={agent_performance.response_quality.score}
            icon={PhoneCall}
          />
          <MetricCard 
            label="Empathy Score" 
            value={agent_performance.empathy_score}
            icon={UserCircle}
          />
        </div>

        {/* Active Alerts Section */}
        <Card className="border-red-200">
          <CardContent className="p-4 space-y-2">
            {customer_analysis.issues.length > 0 && (
              <AlertList 
                items={customer_analysis.issues} 
                label="⚠️ Active Issues" 
              />
            )}
            {interaction_quality.escalation_indicators.length > 0 && (
              <AlertList 
                items={interaction_quality.escalation_indicators} 
                label="🔺 Escalation Risks" 
              />
            )}
            {customer_analysis.pain_points.length > 0 && (
              <AlertList 
                items={customer_analysis.pain_points} 
                label="😟 Pain Points" 
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Status Indicators */}
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-3 rounded-lg text-sm ${getScoreColor(interaction_quality.resolution_status === 'resolved' ? 'excellent' : 'fair')}`}>
            Status: {interaction_quality.resolution_status.replace('_', ' ')}
          </div>
          <div className={`p-3 rounded-lg text-sm ${getScoreColor(agent_performance.solution_effectiveness === 'highly_effective' ? 'excellent' : 'fair')}`}>
            Solution: {agent_performance.solution_effectiveness.replace('_', ' ')}
          </div>
        </div>

        {/* Improvement Areas - if any */}
        {agent_performance.improvement_areas.length > 0 && (
          <Card className="border-yellow-200">
            <CardContent className="p-4">
              <AlertList 
                items={agent_performance.improvement_areas} 
                label="💡 Quick Tips" 
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
