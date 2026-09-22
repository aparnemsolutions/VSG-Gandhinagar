Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Personal Projects\VSG Gandhinagar\VSG-Gandhinagar\src\assets\Vsg Logo.png"
$outDir = "c:\Personal Projects\VSG Gandhinagar\VSG-Gandhinagar\playstore_assets"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

$srcImg = [System.Drawing.Image]::FromFile($srcPath)

# 1. Generate 512x512 App Icon
$icon = New-Object System.Drawing.Bitmap(512, 512)
$iconGraph = [System.Drawing.Graphics]::FromImage($icon)
$iconGraph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$iconGraph.DrawImage($srcImg, 0, 0, 512, 512)
$icon.Save("$outDir\playstore_icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$iconGraph.Dispose()
$icon.Dispose()

# 2. Generate 1024x500 Feature Graphic
$fg = New-Object System.Drawing.Bitmap(1024, 500)
$fgGraph = [System.Drawing.Graphics]::FromImage($fg)
$bgColor = [System.Drawing.ColorTranslator]::FromHtml("#FFFDF5")
$fgGraph.Clear($bgColor)
$fgGraph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Center logo (scale down to 400x400)
$logoSize = 400
$x = (1024 - $logoSize) / 2
$y = (500 - $logoSize) / 2
$fgGraph.DrawImage($srcImg, $x, $y, $logoSize, $logoSize)

$fg.Save("$outDir\playstore_feature_graphic.png", [System.Drawing.Imaging.ImageFormat]::Png)
$fgGraph.Dispose()
$fg.Dispose()
$srcImg.Dispose()

Write-Output "Assets generated successfully in playstore_assets folder!"
