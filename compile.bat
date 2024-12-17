@echo off
echo Deleting dist folder if it exists...
if exist dist (
    rmdir /s /q dist
    echo dist folder deleted.
) else (
    echo dist folder does not exist.
)

echo Starting npm...
call npm start