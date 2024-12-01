import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, UserCircle, PhoneCall, MessageSquare, ChevronUp, ChevronDown, BarChart3, AlertTriangle, Loader2, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { subscribeToAnalysis } from '@/lib/analysisStore';
import { subscribeToTranscriptions } from '@/lib/transcriptionStore';

const TransitionWrapper = ({ children, delay = '0' }) => (
  <div className={`transform transition-all duration-500 ease-out hover:scale-102 ${delay}`}>
    {children}
  </div>
);

const MetricCard = ({ label, value, type = 'standard', icon: Icon, delay = '0' }) => {
  const baseClasses = "p-4 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-lg";
  const getScoreStyle = (score, type) => {
    const styles = {
      standard: {
        critical: 'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 shadow-red-100',
        poor: 'bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 text-orange-700 shadow-orange-100',
        fair: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 text-yellow-700 shadow-yellow-100',
        good: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-emerald-500 text-emerald-700 shadow-emerald-100',
        excellent: 'bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 text-green-700 shadow-green-100'
      },
      sentiment: {
        negative: 'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 shadow-red-100',
        mixed: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 text-yellow-700 shadow-yellow-100',
        neutral: 'bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 text-blue-700 shadow-blue-100',
        positive: 'bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 text-green-700 shadow-green-100'
      },
      urgency: {
        critical: 'bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 shadow-red-100',
        high: 'bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 text-orange-700 shadow-orange-100',
        medium: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 text-yellow-700 shadow-yellow-100',
        low: 'bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 text-green-700 shadow-green-100'
      }
    };
    
    if (type === 'sentiment') return styles.sentiment[score];
    if (type === 'urgency') return styles.urgency[score];
    if (typeof score === 'number') {
      if (score <= 3) return styles.standard.critical;
      if (score <= 5) return styles.standard.poor;
      if (score <= 7) return styles.standard.fair;
      if (score <= 8.5) return styles.standard.good;
      return styles.standard.excellent;
    }
    return styles.standard.fair;
  };

  return (
    <div className={`${baseClasses} ${getScoreStyle(value, type)} ${delay}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium tracking-wide">{label}</span>
        {Icon && <Icon className="w-5 h-5 opacity-70" />}
      </div>
      <div className="text-lg font-bold tracking-tight">
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
    </div>
  );
};

const AlertList = ({ items, label, icon: Icon, bgColor = 'bg-yellow-50', textColor = 'text-yellow-800', borderColor = 'border-yellow-200' }) => 
  items && items.length > 0 && (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg text-sm ${bgColor} ${textColor} border ${borderColor}
              transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-md`}
          >
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 mt-1 flex-shrink-0" />
              <span>{item}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

const TranscriptionView = ({ transcripts }) => (
  <Card className="bg-white/90 backdrop-blur-sm border-gray-200/50 shadow-xl rounded-xl overflow-hidden transition-all duration-300">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          Live Transcription
        </h3>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
        {transcripts.map((transcript, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg text-sm transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-md
              ${transcript.channel === 'EXTERNAL'
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 ml-4'
                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 mr-4'
              }`}
          >
            <div className="flex items-center gap-2 font-medium text-xs mb-1 opacity-75">
              {transcript.channel === 'EXTERNAL' ? (
                <>
                  <UserCircle className="w-3 h-3" />
                  <span>Customer</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-3 h-3" />
                  <span>Agent</span>
                </>
              )}
            </div>
            <p className="leading-relaxed">{transcript.text}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const StatusIndicator = ({ label, value, positive }) => (
  <div className={`p-3 rounded-lg text-sm transition-all duration-300 ease-in-out
    ${positive ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}
    hover:shadow-md transform hover:scale-102`}>
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {positive ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
        <span>{value.replace('_', ' ')}</span>
      </div>
    </div>
  </div>
);

export default function AnalysisDisplay() {
  const [analysis, setAnalysis] = useState(null);
  const [transcripts, setTranscripts] = useState([]);
  const [expanded, setExpanded] = useState(true);

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
      <div className="fixed right-0 top-0 w-96 h-screen bg-white/90 backdrop-blur-sm shadow-2xl p-6">
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-600 text-sm">Analyzing conversation...</p>
        </div>
      </div>
    );
  }

  const { customer_analysis, agent_performance, interaction_quality, business_intelligence } = analysis;

  return (
    <div className="fixed right-0 top-0 w-96 h-screen bg-white/90 backdrop-blur-sm shadow-2xl">
      <div className="h-full overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Real-time Analysis
          </h2>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        <div className={`p-4 space-y-4 transition-all duration-500 ease-in-out ${expanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
          <TransitionWrapper>
            <TranscriptionView transcripts={transcripts} />
          </TransitionWrapper>

          <TransitionWrapper delay="delay-100">
            <div className="grid grid-cols-2 gap-3">
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
          </TransitionWrapper>

          <TransitionWrapper delay="delay-200">
            <div className="grid grid-cols-2 gap-3">
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
          </TransitionWrapper>

          <TransitionWrapper delay="delay-300">
            <Card className="border-red-200">
              <CardContent className="p-4 space-y-4">
                <AlertList 
                  items={customer_analysis.issues}
                  label="Active Issues"
                  icon={AlertCircle}
                  bgColor="bg-red-50"
                  textColor="text-red-800"
                  borderColor="border-red-200"
                />
                <AlertList 
                  items={interaction_quality.escalation_indicators}
                  label="Escalation Risks"
                  icon={AlertTriangle}
                  bgColor="bg-orange-50"
                  textColor="text-orange-800"
                  borderColor="border-orange-200"
                />
                <AlertList 
                  items={customer_analysis.pain_points}
                  label="Pain Points"
                  icon={XCircle}
                  bgColor="bg-yellow-50"
                  textColor="text-yellow-800"
                  borderColor="border-yellow-200"
                />
              </CardContent>
            </Card>
          </TransitionWrapper>

          <TransitionWrapper delay="delay-400">
            <div className="grid grid-cols-2 gap-3">
              <StatusIndicator 
                label="Resolution Status"
                value={interaction_quality.resolution_status}
                positive={interaction_quality.resolution_status === 'resolved'}
              />
              <StatusIndicator 
                label="Solution"
                value={agent_performance.solution_effectiveness}
                positive={agent_performance.solution_effectiveness === 'highly_effective'}
              />
            </div>
          </TransitionWrapper>

          {agent_performance.improvement_areas.length > 0 && (
            <TransitionWrapper delay="delay-500">
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <AlertList 
                    items={agent_performance.improvement_areas}
                    label="Quick Tips"
                    icon={AlertCircle}
                    bgColor="bg-blue-50"
                    textColor="text-blue-800"
                    borderColor="border-blue-200"
                  />
                </CardContent>
              </Card>
            </TransitionWrapper>
          )}

          {business_intelligence.product_feedback.length > 0 && (
            <TransitionWrapper delay="delay-600">
              <Card className="border-emerald-200">
                <CardContent className="p-4">
                  <AlertList 
                    items={business_intelligence.product_feedback}
                    label="Product Feedback"
                    icon={AlertCircle}
                    bgColor="bg-emerald-50"
                    textColor="text-emerald-800"
                    borderColor="border-emerald-200"
                  />
                </CardContent>
              </Card>
            </TransitionWrapper>
          )}

          {business_intelligence.process_improvements.length > 0 && (
            <TransitionWrapper delay="delay-700">
              <Card className="border-indigo-200">
                <CardContent className="p-4">
                  <AlertList 
                    items={business_intelligence.process_improvements}
                    label="Process Improvements"
                    icon={AlertCircle}
                    bgColor="bg-indigo-50"
                    textColor="text-indigo-800"
                    borderColor="border-indigo-200"
                  />
                </CardContent>
              </Card>
            </TransitionWrapper>
          )}

          {business_intelligence.system_issues.length > 0 && (
            <TransitionWrapper delay="delay-800">
              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <AlertList 
                    items={business_intelligence.system_issues}
                    label="System Issues"
                    icon={AlertCircle}
                    bgColor="bg-purple-50"
                    textColor="text-purple-800"
                    borderColor="border-purple-200"
                  />
                </CardContent>
              </Card>
            </TransitionWrapper>
          )}

          {business_intelligence.training_opportunities.length > 0 && (
            <TransitionWrapper delay="delay-900">
              <Card className="border-teal-200">
                <CardContent className="p-4">
                  <AlertList 
                    items={business_intelligence.training_opportunities}
                    label="Training Opportunities"
                    icon={AlertCircle}
                    bgColor="bg-teal-50"
                    textColor="text-teal-800"
                    borderColor="border-teal-200"
                  />
                </CardContent>
              </Card>
            </TransitionWrapper>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 20px;
        }
        .scale-102 {
          --tw-scale-x: 1.02;
          --tw-scale-y: 1.02;
        }
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .delay-100 { animation: fadeSlideIn 0.5s ease-out 0.1s both; }
        .delay-200 { animation: fadeSlideIn 0.5s ease-out 0.2s both; }
        .delay-300 { animation: fadeSlideIn 0.5s ease-out 0.3s both; }
        .delay-400 { animation: fadeSlideIn 0.5s ease-out 0.4s both; }
        .delay-500 { animation: fadeSlideIn 0.5s ease-out 0.5s both; }
        .delay-600 { animation: fadeSlideIn 0.5s ease-out 0.6s both; }
        .delay-700 { animation: fadeSlideIn 0.5s ease-out 0.7s both; }
        .delay-800 { animation: fadeSlideIn 0.5s ease-out 0.8s both; }
        .delay-900 { animation: fadeSlideIn 0.5s ease-out 0.9s both; }
      `}</style>
    </div>
  );
}
