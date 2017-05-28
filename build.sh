#!/bin/bash
npm-do() {
  (PATH=$(npm bin):$PATH; eval $@;)
}
printchoices() {
  echo "Please select an option by inputting a valid digit for one of the following"
  echo "---------------------------------------------------------------------------"
  echo "1. Build for MacOS"
  echo "2. Build for Linux (64-bit)"
  echo "3. Build for Linux (32-bit)"
  echo "4. Build for Windows (64-bit)"
  echo "5. Build for Windows (32-bit)"
  echo "6. Quit"
  echo "---------------------------------------------------------------------------"
  echo
}

while true; do
  printchoices
  read choices
  for choice in $choices; do
    case "$choice" in
      1)
        npm-do webpack && npm run build:mac && exit 0;;
      2)
        npm-do webpack && npm run build:linux:64 && exit 0;;
      3)
        npm-do webpack && npm run build:linux:32 && exit 0;;
      4)
        npm-do webpack && npm run build:win:64 && exit 0;;
      5)
        npm-do webpack && npm run build:win:32 && exit 0;;
      6)
        exit 0;;
      *)
        echo "Please specify a valid integer from the choices provided";;
    esac
  done
done