param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)
$env:PYTHONIOENCODING = "utf-8"
uv run --with google-colab-cli python "$PSScriptRoot\colab_shim.py" @ScriptArgs
