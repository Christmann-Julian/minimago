!include LogicLib.nsh

!macro customInstall
  StrCpy $1 "en"

  ${If} $LANGUAGE == 1036
    StrCpy $1 "fr"
  ${EndIf}

  FileOpen $0 "$INSTDIR\app_lang.txt" w
  FileWrite $0 $1
  FileClose $0
!macroend