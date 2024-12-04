function renderAnalysisDisplay() {
   var appDiv = document.getElementById('app');

   // Create the main container
   var mainDiv = document.createElement('div');
   mainDiv.className = "min-h-screen font-['Open_Sans'] text-center pt-12 bg-gray-100";

   // Create the heading
   var heading = document.createElement('h1');
   heading.className = "text-4xl text-gray-800 mb-5 py-5 px-5 bg-white inline-block shadow-md rounded-lg";
   heading.innerText = "Conversation Analysis";
   mainDiv.appendChild(heading);

   // Create the analysis display container
   var analysisContainer = document.createElement('div');
   analysisContainer.id = 'analysis-container';
   mainDiv.appendChild(analysisContainer);

   appDiv.appendChild(mainDiv);

   window.analysisStore.subscribeToAnalysis(function (newAnalysis) {
       updateAnalysisDisplay(newAnalysis);
   });

   window.transcriptionStore.subscribeToTranscriptions(function (newTranscripts) {
       updateTranscriptionDisplay(newTranscripts);
   });

   var currentAnalysis = window.analysisStore.getCurrentAnalysis();
   if (currentAnalysis) {
       updateAnalysisDisplay(currentAnalysis);
   }

   var currentTranscripts = window.transcriptionStore.getCurrentTranscriptionHistory();
   if (currentTranscripts.length > 0) {
       updateTranscriptionDisplay(currentTranscripts);
   }
}

function updateAnalysisDisplay(newAnalysis) {
   const container = document.getElementById('analysis-container');
   if (!container) return;
   
   try {
       if (!newAnalysis) {
           container.innerHTML = '<div class="text-gray-500">Waiting for analysis...</div>';
           return;
       }

       const analysis = typeof newAnalysis === 'string' ? JSON.parse(newAnalysis) : newAnalysis;
       
       if (!analysis.customer_analysis || !analysis.agent_performance) {
           container.innerHTML = `
               <div class="flex items-center justify-center space-x-2">
                   <div class="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                   <div class="text-blue-500">Analyzing conversation...</div>
               </div>`;
           return;
       }

       const card = window.uiCard.createCard("mb-4");
       
       // Customer Analysis Section
       const customerSection = createSection('Customer Analysis', {
           'Sentiment': analysis.customer_analysis.sentiment || 'Unknown',
           'Issues': (analysis.customer_analysis.issues || []).join(', ') || 'None',
           'Pain Points': (analysis.customer_analysis.pain_points || []).join(', ') || 'None',
           'Urgency': analysis.customer_analysis.urgency_level || 'Unknown'
       });
       card.appendChild(customerSection);

       // Agent Performance Section
       const agentSection = createSection('Agent Performance', {
           'Response Quality': analysis.agent_performance.response_quality ? 
               `${analysis.agent_performance.response_quality.score}/10` : 'N/A',
           'Notes': analysis.agent_performance.response_quality?.notes?.join(', ') || 'None',
           'Empathy Score': analysis.agent_performance.empathy_score ? 
               `${analysis.agent_performance.empathy_score}/10` : 'N/A',
           'Effectiveness': analysis.agent_performance.solution_effectiveness || 'Unknown',
           'Areas for Improvement': (analysis.agent_performance.improvement_areas || []).join(', ') || 'None'
       });
       card.appendChild(agentSection);

       // Interaction Quality Section
       if (analysis.interaction_quality) {
           const interactionSection = createSection('Interaction Quality', {
               'Resolution Status': analysis.interaction_quality.resolution_status || 'Unknown',
               'Compliance Issues': (analysis.interaction_quality.compliance_issues || []).join(', ') || 'None',
               'Escalation Indicators': (analysis.interaction_quality.escalation_indicators || []).join(', ') || 'None',
               'Satisfaction Indicators': (analysis.interaction_quality.customer_satisfaction_indicators || []).join(', ') || 'None'
           });
           card.appendChild(interactionSection);
       }

       // Business Intelligence Section
       if (analysis.business_intelligence) {
           const biSection = createSection('Business Intelligence', {
               'Product Feedback': (analysis.business_intelligence.product_feedback || []).join(', ') || 'None',
               'Process Improvements': (analysis.business_intelligence.process_improvements || []).join(', ') || 'None',
               'System Issues': (analysis.business_intelligence.system_issues || []).join(', ') || 'None',
               'Training Opportunities': (analysis.business_intelligence.training_opportunities || []).join(', ') || 'None'
           });
           card.appendChild(biSection);
       }

       container.innerHTML = '';
       container.appendChild(card);
   } catch (err) {
       window.logger.debug('analysisDisplay', 'Partial analysis received:', err);
       container.innerHTML = `
           <div class="flex items-center justify-center space-x-2">
               <div class="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
               <div class="text-blue-500">Processing analysis...</div>
           </div>`;
   }
}

function updateTranscriptionDisplay(transcripts) {
   if (!transcripts?.length) return;

   const container = document.getElementById('analysis-container');
   if (!container) return;

   const transcriptCard = window.uiCard.createCard("mb-4");
   transcriptCard.innerHTML = `
       <div class="p-4">
           <h2 class="text-lg font-semibold mb-2">Recent Transcripts</h2>
           <div class="space-y-2">
               ${transcripts.map(t => `
                   <div class="p-2 rounded ${t.channel === 'EXTERNAL' ? 'bg-blue-50' : 'bg-gray-50'}">
                       <span class="font-medium">${t.channel === 'EXTERNAL' ? 'Customer' : 'Agent'}:</span>
                       <span>${t.text}</span>
                   </div>
               `).join('')}
           </div>
       </div>
   `;

   // Insert transcript card before any existing content
   container.insertBefore(transcriptCard, container.firstChild);
}

function createSection(title, data) {
   const section = document.createElement('div');
   section.className = 'p-4 border-b last:border-b-0';
   section.innerHTML = `
       <h3 class="font-semibold mb-2">${title}</h3>
       ${Object.entries(data).map(([key, value]) => `
           <div class="mb-1">
               <span class="text-gray-600">${key}:</span>
               <span class="ml-2">${value}</span>
           </div>
       `).join('')}
   `;
   return section;
}
