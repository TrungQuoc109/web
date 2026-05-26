try {
    $word = New-Object -ComObject Word.Application
    if ($word) {
        Write-Output "Word is available via COM"
        $word.Quit()
    }
} catch {
    Write-Output "Word is not available: $_"
}
