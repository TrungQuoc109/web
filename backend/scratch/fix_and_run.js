const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const scriptPath = 'e:\\project\\web\\project-management\\web\\backend\\scratch\\generate_report.ps1';

console.log('Reading generate_report.ps1...');
let content = fs.readFileSync(scriptPath, 'utf8');

// Strip existing BOM if present
if (content.startsWith('\ufeff')) {
    content = content.slice(1);
}

console.log('Adding UTF-8 BOM and writing back...');
fs.writeFileSync(scriptPath, '\ufeff' + content, 'utf8');

console.log('Executing PowerShell script to generate report.docx...');
exec('powershell -ExecutionPolicy Bypass -File ' + scriptPath, (err, stdout, stderr) => {
    if (err) {
        console.error('Execution failed!');
        console.error('Error:', err);
        console.error('stderr:', stderr);
        process.exit(1);
    }
    console.log('Output from PowerShell:');
    console.log(stdout);
    console.log('Completed successfully!');
});
