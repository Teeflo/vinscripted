Add-Type -AssemblyName System.Drawing

$sourcePath = "$PSScriptRoot/../store_assets/logo_1024.png"
$destDir = "$PSScriptRoot/../icons"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir
}

$sizes = @(16, 32, 48, 128)
$image = [System.Drawing.Image]::FromFile($sourcePath)

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graph = [System.Drawing.Graphics]::FromImage($bitmap)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    
    $graph.DrawImage($image, 0, 0, $size, $size)
    
    $outputPath = Join-Path $destDir "icon$size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $bitmap.Dispose()
    $graph.Dispose()
    Write-Host "Created $outputPath"
}

$image.Dispose()
