param([string]$Zip = (Join-Path $HOME 'Downloads\zhixu_doctor_five_states_web.zip'))
$ErrorActionPreference='Stop'
$project=Split-Path -Parent $PSScriptRoot
$assets=Join-Path $project 'public\assets\zhixu-doctor'
$source=Join-Path $project 'public\mentor-ui.js'
if (!(Test-Path -LiteralPath $Zip)) { throw '找不到博士图片素材包。请先将下载的 zip 保存到电脑 Downloads 文件夹。' }
$expected=@('idle.webp','teaching.webp','thinking.webp','success.webp','warning.webp')
New-Item -ItemType Directory -Path $assets -Force | Out-Null
$temp=Join-Path $env:TEMP ('zhixu-doctor-'+[guid]::NewGuid().ToString('N'))
try {
 Expand-Archive -LiteralPath $Zip -DestinationPath $temp -Force
 $inline=@{}
 foreach($name in $expected){
   $f=Join-Path $temp $name
   if (!(Test-Path -LiteralPath $f)) {throw ('Missing asset: '+$name)}
   $bytes=[System.IO.File]::ReadAllBytes($f)
   if ($bytes.Length -lt 1000 -or $bytes.Length -gt 600000) {throw ('Asset size out of range: '+$name)}
   if ([System.Text.Encoding]::ASCII.GetString($bytes,0,4) -ne 'RIFF' -or [System.Text.Encoding]::ASCII.GetString($bytes,8,4) -ne 'WEBP'){throw ('Invalid WebP: '+$name)}
   [System.IO.File]::WriteAllBytes((Join-Path $assets $name),$bytes)
   $inline[$name.Substring(0,$name.Length-5)]='data:image/webp;base64,'+[Convert]::ToBase64String($bytes)
 }
 # Embed in served app.js bundle: the already-running academy does not need to restart or lose BYOK credentials.
 $mentor=[System.IO.File]::ReadAllText($source,[System.Text.Encoding]::UTF8)
 $pattern="(?s)const artMap=\{.*?\};"
 if (!([regex]::IsMatch($mentor,$pattern))){throw 'Doctor image map not found in mentor-ui.js'}
 $js='{'+(($expected|ForEach-Object { $key=$_.Substring(0,$_.Length-5); $key+':'+([System.Text.Json.JsonSerializer]::Serialize($inline[$key])) }) -join ',')+'}'
 $mentor=[regex]::Replace($mentor,$pattern,[System.Text.RegularExpressions.MatchEvaluator]{param($m) 'const artMap='+$js+';'},1)
 [System.IO.File]::WriteAllText($source,$mentor,[System.Text.Encoding]::UTF8)
 Push-Location $project
 try { node scripts/sync-mentor-hot-rc4.mjs; if($LASTEXITCODE -ne 0){throw 'Hot sync failed'}; node --check public/app.js; if($LASTEXITCODE -ne 0){throw 'JS syntax check failed'} }
 finally { Pop-Location }
 Write-Output 'ZHIXU_DOCTOR_5_ASSETS_INSTALLED_REFRESH_TO_VIEW'
} finally { if(Test-Path $temp){Remove-Item $temp -Recurse -Force} }
