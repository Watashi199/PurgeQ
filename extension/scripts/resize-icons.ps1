# Resize icon-master.png into the 3 sizes Chrome / Firefox manifest expects.
# Run from the extension/ directory: powershell -File scripts/resize-icons.ps1
Add-Type -AssemblyName System.Drawing

$imagesDir = Join-Path $PSScriptRoot "..\src\images"
$src = Resolve-Path (Join-Path $imagesDir "icon-master.png")
$master = [System.Drawing.Image]::FromFile($src)

foreach ($size in 16, 48, 128) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($master, 0, 0, $size, $size)

    $out = Join-Path $imagesDir "icon-$size.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "  Saved icon-$size.png"
}

$master.Dispose()
Write-Host "Done."
