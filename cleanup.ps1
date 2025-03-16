# Stop all node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# Function to remove directory with retry
function Remove-DirectoryWithRetry {
    param(
        [string]$path,
        [int]$maxAttempts = 3,
        [int]$sleepSeconds = 2
    )

    for ($i = 1; $i -le $maxAttempts; $i++) {
        try {
            if (Test-Path $path) {
                Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            }
            return $true
        }
        catch {
            Write-Host "Attempt $i of $maxAttempts to remove $path failed. Retrying in $sleepSeconds seconds..."
            Start-Sleep -Seconds $sleepSeconds
        }
    }
    return $false
}

# Directories to clean
$dirsToClean = @('.next', 'out', 'build', '.firebase')

# Clean each directory
foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Write-Host "Cleaning $dir..."
        $success = Remove-DirectoryWithRetry -path $dir
        if (-not $success) {
            Write-Host "Failed to clean $dir after multiple attempts"
        }
    }
}

Write-Host "Cleanup completed" 