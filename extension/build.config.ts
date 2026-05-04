[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "purgeq-extension"
version = "1.0.0"
description = "PurgeQ FACEIT Banlist Browser Extension"

[tool.eslint]
extends = [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
]
