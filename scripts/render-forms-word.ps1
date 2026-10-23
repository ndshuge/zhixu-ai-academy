param([switch]$Candidates)
$ErrorActionPreference='Stop'
Set-Location 'E:\CHATGPT\projects\ai-academy'
$rcWord=New-Object -ComObject Word.Application
$rcWord.Visible=$false
$rcWord.DisplayAlerts=0
try {
 if($Candidates){$rcFiles=@('submission/rc-20261012/官方简介-待实名签署.docx','submission/rc-20261012/官方承诺书-待本人审核签署.docx')}
 else {$rcFiles=@('evidence/rc-20261012/forms-reference/简介原件.docx','evidence/rc-20261012/forms-reference/承诺书原件.docx')}
 foreach($rcPath in $rcFiles){
  $rcAbsolute=(Resolve-Path -LiteralPath $rcPath).Path
  $rcDoc=$rcWord.Documents.Open($rcAbsolute)
  $rcPDF=[System.IO.Path]::ChangeExtension($rcAbsolute,'.pdf')
  $rcDoc.ExportAsFixedFormat($rcPDF,17)
  $rcDoc.Close(0)
  Write-Output ('WORD_RENDER_OK '+$rcPDF)
 }
} finally {$rcWord.Quit(); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($rcWord)}
