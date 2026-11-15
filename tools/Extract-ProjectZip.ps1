# Extract-ProjectZip.ps1
# Windows PowerShell 5.1+ | Safe ZIP extraction for personal projects.
# Example:
# powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Extract-ProjectZip.ps1" -ZipName "TheYub-Technical-Starter-20261112.zip" -ProjectName "the-yub" -DryRun

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ZipName,

    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$DownloadsPath = 'C:\Users\Bin77\Downloads',
    [string]$ProjectsRoot = 'D:\freetime',
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($ProjectName -notmatch '^[a-zA-Z0-9][a-zA-Z0-9_-]*$') {
    throw 'ProjectName must contain only letters, numbers, hyphens or underscores.'
}
if ([IO.Path]::GetFileName($ZipName) -ne $ZipName -or $ZipName -notmatch '(?i)\.zip$') {
    throw 'ZipName must be a ZIP filename, not a path. Example: project.zip'
}
if (-not [IO.Path]::IsPathRooted($DownloadsPath) -or -not [IO.Path]::IsPathRooted($ProjectsRoot)) {
    throw 'DownloadsPath and ProjectsRoot must be absolute paths.'
}

$ZipPath = Join-Path $DownloadsPath $ZipName
$Target = Join-Path $ProjectsRoot $ProjectName
if (-not (Test-Path -LiteralPath $ZipPath -PathType Leaf)) {
    throw "ZIP not found: $ZipPath"
}
if (Test-Path -LiteralPath $Target) {
    throw "Destination already exists. Nothing was changed: $Target"
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
    $filePaths = New-Object 'System.Collections.Generic.List[string]'
    foreach ($entry in $archive.Entries) {
        $relative = $entry.FullName.Replace('\', '/')
        if ([string]::IsNullOrWhiteSpace($relative)) { continue }
        if ($relative.StartsWith('/') -or $relative -match '^[a-zA-Z]:' -or $relative -match '[<>:"|?*]' ) {
            throw "Unsafe ZIP entry: $relative"
        }
        foreach ($segment in $relative.Split('/')) {
            if ($segment -eq '.' -or $segment -eq '..') { throw "Unsafe ZIP path: $relative" }
        }
        if (-not [string]::IsNullOrEmpty($entry.Name)) {
            $filePaths.Add($relative)
        }
    }
    if ($filePaths.Count -eq 0) { throw 'ZIP has no files.' }

    $firstSegments = @($filePaths | ForEach-Object { $_.Split('/')[0] } | Sort-Object -Unique)
    $hasTopLevelFiles = @($filePaths | Where-Object { $_ -notmatch '/' }).Count -gt 0
    $unwrapRoot = ($firstSegments.Count -eq 1 -and -not $hasTopLevelFiles)
    $rootFolderName = if ($unwrapRoot) { $firstSegments[0] } else { '' }
}
finally {
    $archive.Dispose()
}

Write-Host '=== PROJECT ZIP SETUP ===' -ForegroundColor Cyan
Write-Host "ZIP:      $ZipPath"
Write-Host "Project:  $Target"
Write-Host "Files:    $($filePaths.Count)"
Write-Host "Layout:   $(if ($unwrapRoot) { 'Remove one wrapping ZIP folder' } else { 'Extract ZIP contents directly' })"

if ($DryRun) {
    Write-Host '[DRY RUN] Validated ZIP and destination. No files or folders created.' -ForegroundColor Yellow
    exit 0
}

if (-not (Test-Path -LiteralPath $ProjectsRoot -PathType Container)) {
    New-Item -ItemType Directory -Path $ProjectsRoot -Force | Out-Null
}

$staging = Join-Path $ProjectsRoot ('.unpack-' + $ProjectName + '-' + [guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory -Path $staging -ErrorAction Stop | Out-Null
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $staging -ErrorAction Stop
    $payload = if ($unwrapRoot) { Join-Path $staging $rootFolderName } else { $staging }
    if (-not (Test-Path -LiteralPath $payload -PathType Container)) {
        throw "Unexpected ZIP layout. Expected folder: $payload"
    }
    if (Test-Path -LiteralPath $Target) {
        throw "Destination appeared during extraction: $Target"
    }
    Move-Item -LiteralPath $payload -Destination $Target -ErrorAction Stop
    Write-Host "[OK] Project created: $Target" -ForegroundColor Green
    Write-Host "Open in VS Code: code `"$Target`""
}
finally {
    if (Test-Path -LiteralPath $staging) {
        Remove-Item -LiteralPath $staging -Recurse -Force -ErrorAction SilentlyContinue
    }
}
