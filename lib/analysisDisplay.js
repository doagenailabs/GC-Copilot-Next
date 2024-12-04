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

    // Subscribe to analysis updates
    window.analysisStore.subscribeToAnalysis(function (newAnalysis) {
        updateAnalysisDisplay(newAnalysis);
    });

    // Subscribe to transcription updates
    window.transcriptionStore.subscribeToTranscriptions(function (newTranscripts) {
        updateTranscriptionDisplay(newTranscripts);
    });

    // Initial rendering
    var currentAnalysis = window.analysisStore.getCurrentAnalysis();
    if (currentAnalysis) {
        updateAnalysisDisplay(currentAnalysis);
    }

    var currentTranscripts = window.transcriptionStore.getCurrentTranscriptionHistory();
    if (currentTranscripts.length > 0) {
        updateTranscriptionDisplay(currentTranscripts);
    }

    function updateAnalysisDisplay(newAnalysis) {
        // Clear the container
        analysisContainer.innerHTML = '';

        if (!newAnalysis) {
            var loadingDiv = document.createElement('div');
            loadingDiv.className = "flex flex-col items-center justify-center h-full space-y-4";
            var loader = document.createElement('div');
            loader.className = "w-8 h-8 text-blue-500 animate-spin";
            loader.innerText = "Analyzing conversation...";
            loadingDiv.appendChild(loader);
            analysisContainer.appendChild(loadingDiv);
            return;
        }

        try {
            var analysis = JSON.parse(newAnalysis);
            // Build your UI here using the analysis data
            // For simplicity, we'll just display the JSON
            var pre = document.createElement('pre');
            pre.textContent = JSON.stringify(analysis, null, 2);
            analysisContainer.appendChild(pre);
        } catch (err) {
            window.logger.error('analysisDisplay', 'Failed to parse analysis:', err);
        }
    }

    function updateTranscriptionDisplay(newTranscripts) {
        // You can update the transcription display here
        // For simplicity, we'll just log the transcripts
        window.logger.debug('analysisDisplay', 'Transcripts:', newTranscripts);
    }
}
