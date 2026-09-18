@echo off
set PYTHONIOENCODING=utf-8
uv run --with google-colab-cli python "%~dp0colab_shim.py" %*
