document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch available models
    async function fetchAvailableModels() {
        try {
            const response = await fetch('/api/models');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching models:', error);
            return {};
        }
    }

    // Function to update model select elements
    function updateModelSelects(models) {
        const providers = {
            'openai': 'openaiModelSelect',
            'anthropic': 'anthropicModelSelect',
            'gemini': 'geminiModelSelect',
            'deepseek': 'deepseekModelSelect',
            'mistral': 'mistralModelSelect',
            'grok': 'grokModelSelect'
        };

        for (const [provider, selectId] of Object.entries(providers)) {
            const select = document.getElementById(selectId);
            if (!select) continue;

            // Clear existing options
            select.innerHTML = '';

            if (models[provider] && models[provider].length > 0) {
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select a model';
                select.appendChild(defaultOption);

                // Add model options
                models[provider].forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    select.appendChild(option);
                });

                // Enable the select
                select.disabled = false;
            } else {
                // Add "Not available" option
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Not available';
                select.appendChild(option);
                select.disabled = true;
            }
        }
    }

    // Function to handle form submission
    async function handleSubmit(event) {
        event.preventDefault();
        
        const query = document.getElementById('queryInput').value.trim();
        if (!query) {
            alert('Please enter a question');
            return;
        }

        // Collect selected models
        const selectedModels = {
            openai_model: document.getElementById('openaiModelSelect').value,
            anthropic_model: document.getElementById('anthropicModelSelect').value,
            gemini_model: document.getElementById('geminiModelSelect').value,
            deepseek_model: document.getElementById('deepseekModelSelect').value,
            mistral_model: document.getElementById('mistralModelSelect').value,
            grok_model: document.getElementById('grokModelSelect').value
        };

        // Check if at least one model is selected
        const hasSelectedModel = Object.values(selectedModels).some(value => value !== '');
        if (!hasSelectedModel) {
            alert('Please select at least one model to compare');
            return;
        }

        // Show loading indicator
        document.getElementById('loadingIndicator').classList.remove('d-none');
        document.getElementById('responseSection').classList.add('d-none');

        // Scroll to the loading indicator
        document.getElementById('loadingIndicator').scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Clear previous responses
        clearResponses();

        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    ...selectedModels
                })
            });

            const data = await response.json();
            
            // Update response sections
            updateResponseSection('openai', data.openai);
            updateResponseSection('anthropic', data.anthropic);
            updateResponseSection('gemini', data.gemini);
            updateResponseSection('deepseek', data.deepseek);
            updateResponseSection('mistral', data.mistral);
            updateResponseSection('grok', data.grok);

            // Store the data for PDF generation
            window.responseData = {
                query: query,
                responses: data
            };

            // Show response section
            document.getElementById('responseSection').classList.remove('d-none');
            
            // Scroll to the response section
            setTimeout(() => {
                document.getElementById('responseSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while fetching responses');
        } finally {
            // Hide loading indicator
            document.getElementById('loadingIndicator').classList.add('d-none');
        }
    }

    // Function to clear previous responses
    function clearResponses() {
        const providers = ['openai', 'anthropic', 'gemini', 'deepseek', 'mistral', 'grok'];
        
        providers.forEach(provider => {
            const responseElement = document.getElementById(`${provider}Response`);
            const modelElement = document.getElementById(`${provider}Model`);
            const timeElement = document.getElementById(`${provider}Time`);
            
            responseElement.innerHTML = '';
            modelElement.textContent = '';
            timeElement.textContent = '';
        });

        // Clear stored response data
        window.responseData = null;
    }

    // Function to update response section
    function updateResponseSection(provider, data) {
        const responseElement = document.getElementById(`${provider}Response`);
        const modelElement = document.getElementById(`${provider}Model`);
        const timeElement = document.getElementById(`${provider}Time`);
        const card = document.querySelector(`.${provider}-card`);

        if (!responseElement || !modelElement || !timeElement || !card) {
            console.error(`Elements for provider ${provider} not found`);
            return;
        }

        if (data) {
            if (data.error) {
                responseElement.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
                modelElement.textContent = '';
                timeElement.textContent = '';
                card.classList.remove('d-none');
            } else if (data.text) {
                // Use marked to render markdown
                responseElement.innerHTML = marked.parse(data.text);
                modelElement.textContent = data.model;
                timeElement.textContent = `${data.time}s`;
                card.classList.remove('d-none');
            } else {
                card.classList.add('d-none');
            }
        } else {
            card.classList.add('d-none');
        }
    }

    // Function to generate and download PDF
    function generatePDF() {
        if (!window.responseData) {
            alert('No responses to download');
            return;
        }

        // Show loading indicator
        const downloadBtn = document.getElementById('downloadPdfBtn');
        const originalBtnText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Generating PDF...';
        downloadBtn.disabled = true;

        // Get current date and time for filename
        const now = new Date();
        const dateString = now.toISOString().slice(0, 10);
        const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '-');
        const filename = `llm-comparison-${dateString}-${timeString}.pdf`;

        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Set initial position
        let yPos = 20;
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const contentWidth = pageWidth - (margin * 2);

        // Add title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('LLM Comparison Results', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Add date
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${now.toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Add query
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Question:', margin, yPos);
        yPos += 7;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        // Split the query text to fit within margins
        const queryLines = doc.splitTextToSize(window.responseData.query, contentWidth);
        doc.text(queryLines, margin, yPos);
        yPos += (queryLines.length * 7) + 10;

        // Add responses
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Responses:', margin, yPos);
        yPos += 10;

        // Add each model response
        const providers = {
            'openai': 'OpenAI',
            'anthropic': 'Claude',
            'gemini': 'Gemini',
            'deepseek': 'DeepSeek',
            'mistral': 'Mistral',
            'grok': 'Grok'
        };

        for (const [key, displayName] of Object.entries(providers)) {
            const responseData = window.responseData.responses[key];
            if (!responseData || (!responseData.text && !responseData.error)) continue;

            // Check if we need a new page
            if (yPos > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                yPos = 20;
            }

            // Add model name
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            
            let modelText = displayName;
            if (responseData.model) {
                modelText += ` (${responseData.model})`;
            }
            if (responseData.time) {
                modelText += ` - ${responseData.time}s`;
            }
            
            doc.text(modelText, margin, yPos);
            yPos += 7;

            // Add response text or error
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            
            let responseText = '';
            if (responseData.error) {
                responseText = `Error: ${responseData.error}`;
            } else if (responseData.text) {
                // Strip HTML tags from markdown rendered content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = marked.parse(responseData.text);
                responseText = tempDiv.textContent || tempDiv.innerText || '';
            }

            // Split the response text to fit within margins
            const responseLines = doc.splitTextToSize(responseText, contentWidth);
            
            // Check if we need a new page for long responses
            if (yPos + (responseLines.length * 5) > doc.internal.pageSize.getHeight() - 20) {
                const linesPerPage = Math.floor((doc.internal.pageSize.getHeight() - 40) / 5);
                let currentPage = 0;
                
                while (currentPage * linesPerPage < responseLines.length) {
                    if (currentPage > 0) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    const startLine = currentPage * linesPerPage;
                    const endLine = Math.min((currentPage + 1) * linesPerPage, responseLines.length);
                    const pageLines = responseLines.slice(startLine, endLine);
                    
                    doc.text(pageLines, margin, yPos);
                    yPos += (pageLines.length * 5);
                    currentPage++;
                }
            } else {
                doc.text(responseLines, margin, yPos);
                yPos += (responseLines.length * 5);
            }
            
            yPos += 10;
        }

        // Save the PDF
        doc.save(filename);

        // Reset button
        downloadBtn.innerHTML = originalBtnText;
        downloadBtn.disabled = false;
    }

    // Initialize the page
    async function initializePage() {
        // Fetch and update available models
        const models = await fetchAvailableModels();
        updateModelSelects(models);

        // Add event listeners
        document.getElementById('submitButton').addEventListener('click', handleSubmit);
        document.getElementById('downloadPdfBtn').addEventListener('click', generatePDF);
    }

    // Start initialization
    initializePage();
}); 