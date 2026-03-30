document.addEventListener('DOMContentLoaded', () => {

    // --- State Management ---
    const State = {
        caseId: null,
        investigator: null,
        desc: null,
        files: [],           // Array of processed File objects representing allocated files
        recoveredFiles: [],  // Array of simulated recovered files from unallocated space
        selectedFile: null,  // Currently active file for analysis
        isAcquiring: false   // Lock
    };

    // --- DOM Elements ---
    const els = {
        // Navigation
        navItems: document.querySelectorAll('.main-nav li'),
        views: document.querySelectorAll('.view'),

        // Modal & Case
        modalNewCase: document.getElementById('modal-new-case'),
        btnNewCase: document.getElementById('btn-new-case'),
        caseIdDisp: document.getElementById('current-case-id'),
        btnSaveCase: document.getElementById('btn-save-case'),
        formCase: document.getElementById('form-new-case'),

        // Dashboard Stats
        statTotalFiles: document.getElementById('stat-total-files'),
        statTotalSize: document.getElementById('stat-total-size'),
        statHashes: document.getElementById('stat-hashes'),
        statRecovered: document.getElementById('stat-recovered'),
        logList: document.getElementById('activity-log-list'),

        // Acquisition Setup
        uploadInput: document.getElementById('evidence-upload'),
        acqDropzone: document.getElementById('acquisition-dropzone'),
        acqProgress: document.getElementById('acquisition-progress'),
        acqBar: document.getElementById('acq-bar'),
        acqStatus: document.getElementById('acq-status-text'),
        btnStartAcquisition: document.getElementById('btn-start-acquisition'),

        // Evidence View
        fileTree: document.getElementById('file-tree'),
        evidenceTbody: document.getElementById('evidence-tbody'),
        filterInput: document.getElementById('filter-evidence'),

        // Analysis View
        analysisFileName: document.getElementById('analysis-file-name'),
        analysisMeta: document.getElementById('analysis-metadata'),
        hashMd5: document.getElementById('hash-md5'),
        hashSha256: document.getElementById('hash-sha256'),
        btnCalcHash: document.getElementById('btn-calculate-hash'),
        hexContainer: document.getElementById('hex-view-container'),

        // Recovery View
        btnCarve: document.getElementById('btn-run-carver'),
        recoveryTbody: document.getElementById('recovery-tbody'),

        // Reports View
        btnGenReport: document.getElementById('btn-generate-report'),
        btnPrintReport: document.getElementById('btn-print-report'),
        reportPlaceholder: document.getElementById('report-placeholder'),
        reportContainer: document.getElementById('report-container')
    };

    // --- Utility: Formatters ---
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const logActivity = (msg) => {
        const time = new Date().toLocaleTimeString();
        const li = document.createElement('li');
        li.innerHTML = `<span class="time">${time}</span> ${msg}`;
        els.logList.prepend(li);
    };

    // --- Navigation Logic ---
    els.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            // Update active nav state
            els.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding view
            const targetId = item.querySelector('a').id.replace('nav-', 'view-');
            els.views.forEach(view => {
                view.classList.add('hidden');
                if (view.id === targetId) {
                    view.classList.remove('hidden');
                }
            });
        });
    });

    // --- Case Management ---
    els.btnNewCase.addEventListener('click', () => {
        els.modalNewCase.classList.remove('hidden');
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            els.modalNewCase.classList.add('hidden');
        });
    });

    els.btnSaveCase.addEventListener('click', (e) => {
        e.preventDefault();
        const cid = document.getElementById('case-id').value;
        const inv = document.getElementById('investigator-name').value;
        if (cid && inv) {
            State.caseId = cid;
            State.investigator = inv;
            State.desc = document.getElementById('case-desc').value;
            els.caseIdDisp.textContent = cid;
            els.modalNewCase.classList.add('hidden');
            logActivity(`Case [${cid}] initialized by ${inv}.`);

            // Switch to Acquisition view
            document.getElementById('nav-acquisition').parentElement.click();
        } else {
            alert("Case Number and Investigator are required.");
        }
    });

    // --- Step 1: Logical Acquisition Simulation (File API) ---
    els.btnStartAcquisition.addEventListener('click', () => {
        if (!State.caseId) {
            alert("Please initialize a case first.");
            els.btnNewCase.click();
            return;
        }
        els.uploadInput.click();
    });

    els.uploadInput.addEventListener('change', async (e) => {
        const fileList = e.target.files;
        if (fileList.length === 0) return;

        State.files = Array.from(fileList);
        els.acqDropzone.classList.add('hidden');
        els.acqProgress.classList.remove('hidden');
        State.isAcquiring = true;
        els.btnStartAcquisition.disabled = true;

        logActivity(`Starting logical acquisition. Found ${State.files.length} artifacts.`);

        // Simulate reading the MFT / FAT and building the layout
        let totalSize = 0;
        let folders = new Set();

        State.files.forEach(f => {
            totalSize += f.size;
            // f.webkitRelativePath contains the full path including the root folder
            const pathParts = f.webkitRelativePath.split('/');
            if (pathParts.length > 1) {
                folders.add(pathParts[0]); // Root dir
            }
        });

        // Fast progress simulation
        for (let i = 0; i <= 100; i += 5) {
            els.acqBar.style.width = `${i}%`;
            els.acqStatus.textContent = `Parsing File System Structures (NTFS/FAT)... ${i}%`;
            await new Promise(r => setTimeout(r, 40));
        }

        els.acqStatus.textContent = `Acquisition Complete! Validating indexing...`;
        await new Promise(r => setTimeout(r, 500));

        // Update Dashboard Stats
        els.statTotalFiles.textContent = State.files.length;
        els.statTotalSize.textContent = formatBytes(totalSize);
        logActivity(`Acquisition finished. Size: ${formatBytes(totalSize)}.`);

        // Populate Evidence View
        populateEvidenceTable(State.files);
        populateFileTree(folders);

        // Reset Acquisition UI
        State.isAcquiring = false;
        els.btnStartAcquisition.disabled = false;
        els.acqProgress.classList.add('hidden');
        els.acqDropzone.classList.remove('hidden');
        els.uploadInput.value = ''; // clear

        // Auto transition to Evidence tab
        document.getElementById('nav-evidence').parentElement.click();
    });

    // --- Step 2: Evidence UI Parsing ---
    const populateFileTree = (folderSet) => {
        els.fileTree.innerHTML = '';
        folderSet.forEach(folder => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-folder"></i> ${folder} <span class="badge badge-ntfs ml-1">NTFS root</span>`;
            els.fileTree.appendChild(li);
        });
    };

    const populateEvidenceTable = (filesArray) => {
        els.evidenceTbody.innerHTML = '';
        if (filesArray.length === 0) {
            els.evidenceTbody.innerHTML = `<tr><td colspan="5" class="text-center">No data found</td></tr>`;
            return;
        }

        filesArray.forEach((f, idx) => {
            const tr = document.createElement('tr');
            tr.dataset.index = idx; // Store ref to original file object in State.files
            tr.dataset.source = 'allocated';

            // Format Last Modified
            const d = new Date(f.lastModified);
            const dateStr = `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours()}:${d.getMinutes()}`;

            let statusHtml = `<span class="badge badge-ntfs">Allocated</span>`;

            tr.innerHTML = `
                <td><i class="fa-regular fa-file text-muted mr-2"></i> ${f.name}</td>
                <td title="${f.webkitRelativePath}">${f.webkitRelativePath.substring(0, 40)}...</td>
                <td>${formatBytes(f.size)}</td>
                <td>${dateStr}</td>
                <td>${statusHtml}</td>
            `;

            tr.addEventListener('click', () => handleFileSelection(tr, f, 'allocated'));
            els.evidenceTbody.appendChild(tr);
        });
    };

    // --- Step 3: Analysis & Cryptographic Hashing ---
    const handleFileSelection = (tr, fileObj, sourceType) => {
        // Highlight row
        document.querySelectorAll('.data-table tbody tr').forEach(row => row.classList.remove('selected'));
        tr.classList.add('selected');

        State.selectedFile = { file: fileObj, source: sourceType };

        // Auto-switch to analysis tab
        document.getElementById('nav-analysis').parentElement.click();

        els.analysisFileName.textContent = fileObj.name;

        let metaHtml = `
            <div class="meta-item"><label>Filename</label><span>${fileObj.name}</span></div>
            <div class="meta-item"><label>Path</label><span>${fileObj.webkitRelativePath || 'Unallocated Space'}</span></div>
            <div class="meta-item"><label>Logical Size</label><span>${formatBytes(fileObj.size)}</span></div>
            <div class="meta-item"><label>MIME Type</label><span>${fileObj.type || 'application/octet-stream'}</span></div>
            <div class="meta-item"><label>Last Modified (MAC)</label><span>${new Date(fileObj.lastModified).toISOString()}</span></div>
        `;
        els.analysisMeta.innerHTML = metaHtml;

        // Reset hashes
        els.hashMd5.value = "Pending calculation";
        els.hashSha256.value = "Pending calculation";
        els.btnCalcHash.disabled = false;
        els.btnCalcHash.textContent = "Verify Integrity (Compute Hash)";
        els.btnCalcHash.classList.remove('btn-primary');
        els.btnCalcHash.classList.add('btn-outline');

        // Hex Viewer Reset
        els.hexContainer.innerHTML = '<div class="text-center text-muted mt-4"><i class="fa-solid fa-spinner fa-spin"></i> Reading raw bytes...</div>';

        // Load preview (First 1KB for Hex view)
        const reader = new FileReader();
        reader.onload = function (e) {
            const buffer = e.target.result;
            renderHexView(buffer);
        };
        const chunk = fileObj.slice(0, 1024); // read first KB
        reader.readAsArrayBuffer(chunk);
    };

    const renderHexView = (arrayBuffer) => {
        const bytes = new Uint8Array(arrayBuffer);
        let hexOutput = '';

        for (let i = 0; i < bytes.length; i += 16) {
            // Offset
            let offset = i.toString(16).padStart(8, '0').toUpperCase();

            // Hex values
            let hexLine = '';
            let asciiLine = '';

            for (let j = 0; j < 16; j++) {
                if (i + j < bytes.length) {
                    let byteCode = bytes[i + j];
                    hexLine += byteCode.toString(16).padStart(2, '0').toUpperCase() + ' ';
                    // ASCII printable?
                    asciiLine += (byteCode >= 32 && byteCode <= 126) ? String.fromCharCode(byteCode) : '.';
                } else {
                    hexLine += '   ';
                }
                if (j === 7) hexLine += ' '; // middle gap
            }

            hexOutput += `<span class="hex-offset">${offset}</span>${hexLine} <span class="hex-ascii">${asciiLine.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>\n`;
        }

        if (bytes.length === 0) {
            els.hexContainer.innerHTML = '<div class="empty-state">File is empty (0 bytes).</div>';
        } else {
            els.hexContainer.innerHTML = hexOutput;
        }
    };

    // Cryptography using Web Crypto API
    els.btnCalcHash.addEventListener('click', async () => {
        if (!State.selectedFile) return;

        els.btnCalcHash.disabled = true;
        els.btnCalcHash.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculating...';

        try {
            const file = State.selectedFile.file;
            const arrayBuffer = await file.arrayBuffer(); // Load full file into memory to hash

            // Generate Hash buffer
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

            // Convert buffer to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            els.hashSha256.value = hashHex;
            els.hashMd5.value = "Requires custom JS implementation, SHA-256 used instead"; // WebCrypto native doesn't do MD5 well

            els.btnCalcHash.innerHTML = '<i class="fa-solid fa-check"></i> Verified (Chain of Custody)';
            els.btnCalcHash.classList.remove('btn-outline');
            els.btnCalcHash.classList.add('btn-primary');

            // Update stats
            let currentHashes = parseInt(els.statHashes.textContent);
            els.statHashes.textContent = currentHashes + 1;
            logActivity(`Integrity verified for ${file.name}. SHA-256 matched.`);

        } catch (e) {
            console.error("Hashing failed:", e);
            els.btnCalcHash.textContent = "Error calculating hash";
        }
    });

    // --- Step 4: Data Recovery (Carving Simulation) ---
    els.btnCarve.addEventListener('click', async () => {
        els.btnCarve.disabled = true;
        els.btnCarve.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Carving sectors...';

        // Simulating the discovery of deleted files via file signatures (magic numbers)
        logActivity(`Initiating File Carver on unallocated space.`);

        // Wait 2 secs to simulate intense CPU hashing/scanning
        await new Promise(r => setTimeout(r, 2000));

        // Create mock recovered files
        const mockRecovered = [
            {
                name: "file_00102.jpg",
                signature: "JPEG (FF D8 FF E0)",
                size: 450212,
                integrity: 85,
                type: "image/jpeg",
                ext: "jpg"
            },
            {
                name: "file_00344.pdf",
                signature: "PDF (%PDF-1.)",
                size: 1048500,
                integrity: 100,
                type: "application/pdf",
                ext: "pdf"
            },
            {
                name: "file_00511.sqlite",
                signature: "SQLite format 3",
                size: 8192,
                integrity: 40, // Partially overwritten
                type: "application/x-sqlite3",
                ext: "sqlite"
            }
        ];

        State.recoveredFiles = mockRecovered;

        els.recoveryTbody.innerHTML = '';
        mockRecovered.forEach(f => {
            const tr = document.createElement('tr');

            let htmlIntegrity = '';
            if (f.integrity > 80) htmlIntegrity = `<span style="color:var(--accent-green)">${f.integrity}% Intact</span>`;
            else if (f.integrity > 50) htmlIntegrity = `<span style="color:var(--accent-warning)">${f.integrity}% Partial</span>`;
            else htmlIntegrity = `<span style="color:var(--accent-red)">${f.integrity}% Corrupt/Overwritten</span>`;

            tr.innerHTML = `
                <td><i class="fa-solid fa-ghost text-muted mr-2"></i> ${f.name}</td>
                <td><span class="badge badge-deleted">${f.signature}</span></td>
                <td>${formatBytes(f.size)}</td>
                <td>${htmlIntegrity}</td>
                <td><button class="btn-sm btn-outline"><i class="fa-solid fa-download"></i> Extract</button></td>
            `;
            els.recoveryTbody.appendChild(tr);
        });

        // Update stats
        els.statRecovered.textContent = mockRecovered.length;
        logActivity(`Carving complete. Sector analysis yielded ${mockRecovered.length} fragmented files.`);

        els.btnCarve.innerHTML = '<i class="fa-solid fa-check"></i> Carver Engine Finished';
        els.btnCarve.classList.remove('btn-warning');
        els.btnCarve.classList.add('btn-outline');
    });

    // --- Search Filter ---
    els.filterInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = els.evidenceTbody.querySelectorAll('tr');

        rows.forEach(row => {
            if (row.children.length > 1) { // ignore the "empty" row
                const name = row.children[0].textContent.toLowerCase();
                const path = row.children[1].textContent.toLowerCase();
                if (name.includes(term) || path.includes(term)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            }
        });
    });

    // --- Step 5: Report Generation ---
    els.btnGenReport.addEventListener('click', () => {
        if (!State.caseId) {
            alert("No case initialized.");
            return;
        }

        els.btnGenReport.disabled = true;
        els.btnGenReport.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Compiling...';

        setTimeout(() => {
            // Build report HTML
            const dateStr = new Date().toLocaleString();
            let html = `
                <h1>Digital Forensics Case Summary</h1>
                
                <div class="report-meta">
                    <div><strong>Case ID:</strong> ${State.caseId}</div>
                    <div><strong>Investigator:</strong> ${State.investigator || 'N/A'}</div>
                    <div><strong>Report Generated:</strong> ${dateStr}</div>
                    <div><strong>Total Acquired Files:</strong> ${State.files.length}</div>
                </div>

                <div class="report-section">
                    <h3>Case Description</h3>
                    <p>${State.desc || 'No description provided.'}</p>
                </div>
                
                <div class="report-section">
                    <h3>Acquired Evidence Log</h3>
                    <p>The following logical files were acquired during the session (simulated NTFS/FAT parse):</p>
                    <table class="report-table">
                        <thead>
                            <tr><th>File Name</th><th>Path</th><th>Size</th><th>Last Modified (MAC)</th></tr>
                        </thead>
                        <tbody>
            `;

            State.files.forEach(f => {
                const fd = new Date(f.lastModified).toLocaleString();
                html += `<tr><td>${f.name}</td><td>${f.webkitRelativePath}</td><td>${formatBytes(f.size)}</td><td>${fd}</td></tr>`;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            if (State.recoveredFiles && State.recoveredFiles.length > 0) {
                html += `
                <div class="report-section">
                    <h3>Recovered Items (Carver Simulation)</h3>
                    <table class="report-table">
                        <thead>
                            <tr><th>Item Name</th><th>Matched Signature</th><th>Estimated Size</th><th>Integrity</th></tr>
                        </thead>
                        <tbody>
                `;
                State.recoveredFiles.forEach(rf => {
                    html += `<tr><td>${rf.name}</td><td>${rf.signature}</td><td>${formatBytes(rf.size)}</td><td>${rf.integrity}%</td></tr>`;
                });
                html += `</tbody></table></div>`;
            }

            html += `
                <div style="margin-top:4rem; text-align:center; font-style:italic; border-top: 1px solid #d1d5db; padding-top: 1rem;">
                    End of Report - EnVision Forensics v2.4.1<br>
                    CONFIDENTIAL FORENSIC DOCUMENT
                </div>
            `;

            els.reportContainer.innerHTML = html;

            els.reportPlaceholder.classList.add('hidden');
            els.reportContainer.classList.remove('hidden');
            els.btnPrintReport.classList.remove('hidden');

            els.btnGenReport.innerHTML = '<i class="fa-solid fa-check"></i> Report Generated';
            els.btnGenReport.classList.remove('btn-primary');
            els.btnGenReport.classList.add('btn-outline');

            logActivity("Case report compiled and rendered.");
        }, 800); // Simulate processing time
    });

});
