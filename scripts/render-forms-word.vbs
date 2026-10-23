Set word = CreateObject("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
For Each filename In WScript.Arguments
 On Error Resume Next
 Set doc = word.Documents.Open(filename, False, True)
 If Err.Number <> 0 Then
  WScript.Echo "WORD_RENDER_FAILED"
  word.Quit
  WScript.Quit 1
 End If
 On Error GoTo 0
 pdf = Left(filename, Len(filename)-5) & ".pdf"
 doc.ExportAsFixedFormat pdf, 17
 doc.Close 0
 WScript.Echo "WORD_RENDER_OK " & pdf
Next
word.Quit
