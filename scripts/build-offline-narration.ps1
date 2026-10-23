$ErrorActionPreference='Stop'
Set-Location 'E:\CHATGPT\projects\ai-academy'
Add-Type -AssemblyName System.Speech
$cues=Get-Content -Raw -Encoding UTF8 'submission/rc-20261012/natural-narration.json' | ConvertFrom-Json
$dir='submission/rc-20261012'
$s=New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Huihui Desktop')
$s.Rate=3
for($i=0;$i -lt $cues.Count;$i++){
 $file=Join-Path (Get-Location) "$dir/offline-voice-$i.wav"
 $s.SetOutputToWaveFile($file); $s.Speak($cues[$i].text);$s.SetOutputToNull()
 Write-Output "VOICE $i"
}
$s.Dispose()
