$ErrorActionPreference='Stop'
Set-Location 'E:\CHATGPT\projects\ai-academy'
Add-Type -AssemblyName System.Speech
$rcCues=Get-Content -Raw -Encoding UTF8 'submission/rc-20261012/demo-narration.json' | ConvertFrom-Json
$rcSpeech=New-Object System.Speech.Synthesis.SpeechSynthesizer
$rcSpeech.SelectVoice('Microsoft Huihui Desktop')
$rcSpeech.Rate=1
$rcIndex=0
foreach($rcCue in $rcCues){
 $rcFile=Join-Path (Get-Location) ('submission/rc-20261012/voice-'+$rcIndex+'.wav')
 $rcSpeech.SetOutputToWaveFile($rcFile)
 $rcSpeech.Speak($rcCue.text)
 $rcSpeech.SetOutputToNull()
 $rcIndex++
}
$rcSpeech.Dispose()
Write-Output ('OFFLINE_NARRATION_OK '+$rcIndex)
