// Helper function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// State management
let allExtractedText = {}; // Store all extracted text by fileName
let processedCount = 0;
let totalFiles = 0;

// Wait for PDF.js to load with better detection
let pdfJsReady = false;

function initializePDF() {
    // Try different ways to access PDF.js
    const pdfjsLib = window.pdfjs || window.pdfjsLib || window['pdfjs-dist/build/pdf'];
    
    if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        window.pdfjs = pdfjsLib; // Ensure consistent access
        pdfJsReady = true;
        return true;
    }
    return false;
}

// Initialize with multiple attempts
function ensurePDFJsLoaded() {
    return new Promise((resolve, reject) => {
        if (pdfJsReady) {
            resolve();
            return;
        }

        let attempts = 0;
        const maxAttempts = 20; // 10 seconds total
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (initializePDF()) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('PDF.js failed to load after multiple attempts'));
            }
        }, 500);
    });
}

// Initialize app once DOM is ready (or immediately if already loaded)
function initializeApp() {
    setupUploadButtons();
    setupDragAndDrop();
    setupFileCounter();
    setupCopyAllButton();
    setupFormSubmit();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Additional fallback attempts to ensure worker is available
setTimeout(() => initializePDF(), 1000);
setTimeout(() => initializePDF(), 3000);

// Setup upload buttons
function setupUploadButtons() {
    const folderBtn = document.getElementById('folder-btn');
    const filesBtn = document.getElementById('files-btn');
    const folderInput = document.getElementById('folder-input');
    const filesInput = document.getElementById('files-input');

    if (folderBtn && folderInput) {
        folderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderInput.click();
        });
    }
    if (filesBtn && filesInput) {
        filesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            filesInput.click();
        });
    }
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadZone = document.querySelector('.upload-zone');
    const container = document.querySelector('.container');

    if (!uploadZone || !container) return;

    // Handle drag and drop on the entire container
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.backgroundColor = '#e3f2fd';
        uploadZone.style.borderColor = '#2196f3';
        uploadZone.style.transform = 'translateY(-2px) scale(1.02)';
    });

    container.addEventListener('dragleave', (e) => {
        e.preventDefault();
        // Only reset if we're actually leaving the container
        if (!container.contains(e.relatedTarget)) {
            uploadZone.style.backgroundColor = '';
            uploadZone.style.borderColor = '';
            uploadZone.style.transform = '';
        }
    });

    container.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.backgroundColor = '';
        uploadZone.style.borderColor = '';
        uploadZone.style.transform = '';
        
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        const folderInput = document.getElementById('folder-input');
        const filesInput = document.getElementById('files-input');
        
        // Determine if it's a folder or files based on the first file's webkitRelativePath
        if (files[0].webkitRelativePath && files[0].webkitRelativePath.includes('/')) {
            // It's a folder drop
            if (folderInput) folderInput.files = files;
        } else {
            // It's individual files
            if (filesInput) filesInput.files = files;
        }
        updateFileCount();
        processFiles(files);
    });
}

// Setup file counter
function setupFileCounter() {
    const folderInput = document.getElementById('folder-input');
    const filesInput = document.getElementById('files-input');
    
    if (folderInput) {
        folderInput.addEventListener('change', function() {
            updateFileCount();
            if (this.files.length > 0) {
                processFiles(this.files);
            }
        });
    }
    if (filesInput) {
        filesInput.addEventListener('change', function() {
            updateFileCount();
            if (this.files.length > 0) {
                processFiles(this.files);
            }
        });
    }
}

// Update file count display
function updateFileCount() {
    const folderInput = document.getElementById('folder-input');
    const filesInput = document.getElementById('files-input');
    
    const folderFiles = folderInput ? folderInput.files : [];
    const filesFiles = filesInput ? filesInput.files : [];
    
    const allFiles = [...folderFiles, ...filesFiles];
    const validFiles = allFiles.filter(file => {
        const name = file.name;
        return !name.startsWith('.') && !name.startsWith('._');
    });
    
    const fileCountElement = document.getElementById('file-count');
    if (fileCountElement) {
        fileCountElement.textContent = validFiles.length;
    }
}

// Setup copy all button
function setupCopyAllButton() {
    const copyAllBtn = document.getElementById('copy-all-btn');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', copyAllText);
    }
}

// Copy all extracted text
function copyAllText() {
    if (Object.keys(allExtractedText).length === 0) {
        alert('No text to copy. Please extract text from files first.');
        return;
    }
    
    let allText = '';
    Object.keys(allExtractedText).forEach(fileName => {
        allText += `=== ${fileName} ===\n`;
        allText += allExtractedText[fileName];
        allText += '\n\n';
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(allText).then(function() {
        const copyBtn = document.getElementById('copy-all-btn');
        const originalText = copyBtn.textContent;
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.textContent = originalText;
        }, 2000);
    }).catch(function(err) {
        alert('Failed to copy text: ' + err.message);
    });
}

// Update controls bar visibility
function updateControlsBar() {
    const controlsBar = document.getElementById('controls-bar');
    const processedCountSpan = document.getElementById('processed-count');
    
    if (processedCountSpan) {
        processedCountSpan.textContent = processedCount;
    }
    
    if (controlsBar) {
        if (processedCount > 0) {
            controlsBar.classList.add('active');
        } else {
            controlsBar.classList.remove('active');
        }
    }
}

// Show loading state
function showLoading(fileName) {
    const outputDiv = document.getElementById('output');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'document-result';
    loadingDiv.innerHTML = `
        <div class="document-title">${fileName}</div>
        <div class="loading">Extracting text...</div>
    `;
    loadingDiv.id = `loading-${fileName}`;
    outputDiv.appendChild(loadingDiv);
}

// Show result
function showResult(fileName, content, isError = false) {
    const loadingDiv = document.getElementById(`loading-${fileName}`);
    if (loadingDiv) {
        loadingDiv.remove();
    }
    
    const outputDiv = document.getElementById('output');
    const resultDiv = document.createElement('div');
    resultDiv.className = 'document-result';
    
    // Store non-error content for copy all functionality
    if (!isError) {
        // Extract the raw text content (remove the file type prefix and page info)
        const textOnly = content.replace(/^📄.*?\n\n/, '').replace(/^📝.*?\n\n/, '');
        allExtractedText[fileName] = textOnly;
        processedCount++;
        updateControlsBar();
    }
    
    if (isError) {
        resultDiv.innerHTML = `
            <div class="document-header">
                <div class="document-title">${fileName}</div>
            </div>
            <div class="error-message">${content}</div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="document-header">
                <div class="document-title">${fileName}</div>
                <button class="copy-btn" title="Copy text" aria-label="Copy text from ${fileName}">
                    <span class="copy-icon">📋</span>
                    <span class="copy-text">Copy</span>
                </button>
            </div>
            <div class="document-content">${escapeHtml(content)}</div>
        `;
        
        // Add click handler for copy button
        const copyBtn = resultDiv.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const textOnly = content.replace(/^📄.*?\n\n/, '').replace(/^📝.*?\n\n/, '');
                navigator.clipboard.writeText(textOnly).then(function() {
                    const originalIcon = copyBtn.querySelector('.copy-icon').textContent;
                    const originalText = copyBtn.querySelector('.copy-text').textContent;
                    
                    copyBtn.classList.add('copied');
                    copyBtn.querySelector('.copy-icon').textContent = '✅';
                    copyBtn.querySelector('.copy-text').textContent = 'Copied!';
                    
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.querySelector('.copy-icon').textContent = originalIcon;
                        copyBtn.querySelector('.copy-text').textContent = originalText;
                    }, 2000);
                }).catch(function(err) {
                    alert('Failed to copy text: ' + err.message);
                });
            });
        }
    }
    
    outputDiv.appendChild(resultDiv);
}

// Process files with better PDF.js handling
async function processFiles(files) {
    const outputDiv = document.getElementById('output');
    const uploadZone = document.querySelector('.upload-zone');
    
    outputDiv.innerHTML = '';
    
    // Reset state
    allExtractedText = {};
    processedCount = 0;
    
    // Filter out system files (hidden files, Mac metadata, etc.)
    const validFiles = Array.from(files).filter(file => {
        const name = file.name;
        // Ignore hidden files and Mac metadata files (start with . or ._)
        if (name.startsWith('.') || name.startsWith('._')) return false;
        // Ignore common system/junk files
        const junkFiles = ['thumbs.db', 'desktop.ini', 'node_modules', '.git'];
        if (junkFiles.includes(name.toLowerCase())) return false;
        return true;
    });

    totalFiles = validFiles.length;
    updateControlsBar();
    
    if (totalFiles === 0) {
        outputDiv.innerHTML = '<div class="document-result"><div class="error-message">No valid documents found in the selection.</div></div>';
        return;
    }
    
    // Add processing state to upload zone
    if (uploadZone) {
        uploadZone.classList.add('processing');
    }
    
    try {
        // Wait for PDF.js to be ready
        await ensurePDFJsLoaded();
    } catch (error) {
        showResult('Library Error', 'Failed to load PDF processing library. Please refresh the page and try again.', true);
        if (uploadZone) {
            uploadZone.classList.remove('processing');
        }
        return;
    }

    for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();
        
        showLoading(fileName);
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const content = event.target.result;
            
            if (file.type === 'application/pdf' || fileExt === 'pdf') {
                // Enhanced PDF processing with better error handling
                const pdfjsLib = window.pdfjs || window.pdfjsLib;
                
                pdfjsLib.getDocument({data: content}).promise.then(function(pdf) {
                    let textContent = '';
                    const pagePromises = [];
                    
                    // Enhanced PDF text extraction with better formatting
                    for (let j = 1; j <= pdf.numPages; j++) {
                        pagePromises.push(
                            pdf.getPage(j).then(function(page) {
                                return page.getTextContent();
                            }).then(function(text) {
                                let pageText = `--- Page ${j} ---\n`;
                                text.items.forEach(function(item, index) {
                                    // Add the text with some basic formatting
                                    pageText += item.str;
                                    // Add space if this item doesn't end with space and next item doesn't start with space
                                    if (index < text.items.length - 1 && 
                                        !item.str.endsWith(' ') && 
                                        !text.items[index + 1].str.startsWith(' ')) {
                                        pageText += ' ';
                                    }
                                });
                                textContent += pageText + '\n\n';
                            })
                        );
                    }
                    
                    Promise.all(pagePromises).then(function() {
                        const finalText = textContent.trim() || 'No text found in PDF';
                        showResult(fileName, `📄 PDF Document (${pdf.numPages} pages)\n\n${finalText}`);
                    });
                }).catch(function(err) {
                    showResult(fileName, `Error reading PDF: ${err.message}`, true);
                });
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExt === 'docx') {
                // Convert DOCX to text
                if (typeof mammoth !== 'undefined') {
                    mammoth.extractRawText({arrayBuffer: content})
                        .then(function(result) {
                            const text = result.value.trim() || 'No text found in document';
                            showResult(fileName, `📝 Word Document\n\n${text}`);
                        })
                        .catch(function(err) {
                            showResult(fileName, `Error reading DOCX: ${err.message}`, true);
                        });
                } else {
                    showResult(fileName, 'Mammoth library is loading. Please try again.', true);
                }
            } else if (file.type.startsWith('text/') || ['txt', 'csv', 'json', 'xml', 'html', 'md', 'rtf', 'log'].includes(fileExt)) {
                // Read as text for text-based formats
                const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
                const displayText = textContent.trim() || 'No text content found';
                showResult(fileName, `📄 Text File\n\n${displayText}`);
            } else {
                // For unknown formats, try to read as text
                try {
                    const textContent = typeof content === 'string' ? content : new TextDecoder().decode(new Uint8Array(content));
                    const displayText = textContent.trim() || 'No readable text content found';
                    showResult(fileName, `📄 Unknown Format\n\n${displayText}`);
                } catch (e) {
                    showResult(fileName, `Cannot extract text from this file format.\nFile size: ${(file.size / 1024).toFixed(2)} KB\nTry converting to PDF or a text format first.`, true);
                }
            }
        };

        // Read the file according to its type
        if (file.type === 'application/pdf' || fileExt === 'pdf' || 
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExt === 'docx') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    }

    // Remove processing state when done
    if (uploadZone) {
        uploadZone.classList.remove('processing');
    }
}

// Form submit handler with async support
function setupFormSubmit() {
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const folderInput = document.getElementById('folder-input');
            const filesInput = document.getElementById('files-input');
            
            const folderFiles = folderInput ? folderInput.files : [];
            const filesFiles = filesInput ? filesInput.files : [];
            
            // Combine files from both inputs
            const allFiles = [...folderFiles, ...filesFiles];
            
            if (allFiles.length === 0) {
                alert('Please select files to extract text from.');
                return;
            }
            
            await processFiles(allFiles);
        });
    }
}

// Theme management
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Check for saved theme preference, default to dark
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Default to dark theme (no explicit attribute needed, it's the CSS default)
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }

    themeToggle.addEventListener('click', () => {
        let currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Initialize theme toggle
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
} else {
    setupThemeToggle();
}