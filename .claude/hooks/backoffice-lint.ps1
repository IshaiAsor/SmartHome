$j = $input | ConvertFrom-Json
$fp = $j.tool_input.file_path
if ($fp -match 'backoffice[/\\]src[/\\].*\.(html|css|ts)$') {
    $r = & npm --prefix 'C:\Projects\iot-smart-home\backoffice' run lint 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        @{ decision = 'block'; reason = "Backoffice lint failed after editing $fp`:`n$r" } | ConvertTo-Json -Compress
        exit 1
    }
    $r = & npx --prefix 'C:\Projects\iot-smart-home\backoffice' tsc --project 'C:\Projects\iot-smart-home\backoffice\tsconfig.app.json' --noEmit 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        @{ decision = 'block'; reason = "Backoffice TypeScript compile failed after editing $fp`:`n$r" } | ConvertTo-Json -Compress
        exit 1
    }
    $r = & npm --prefix 'C:\Projects\iot-smart-home\backoffice' run test -- --watch=false --browsers ChromeHeadless --no-progress 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        @{ decision = 'block'; reason = "Backoffice tests failed after editing $fp`:`n$r" } | ConvertTo-Json -Compress
        exit 1
    }
}
