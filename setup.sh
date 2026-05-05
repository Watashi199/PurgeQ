#!/usr/bin/env bash
# Quick setup script for development

set -e

# Re-execute with bash if script is run under sh/dash
if [ -z "${BASH_VERSION:-}" ]; then
  if command -v bash >/dev/null 2>&1; then
    exec bash "$0" "$@"
  fi
fi

echo "🚀 Setting up PurgeQ..."
echo ""

# Check Python version
echo "Checking Python version..."
PYTHON_CMD=""
if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=python
else
  echo "❌ Python not found. Install Python 3.12+ and rerun this script."
  exit 1
fi

python_version=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
python_major=$(echo "$python_version" | cut -d. -f1)
python_minor=$(echo "$python_version" | cut -d. -f2)

if [ "$python_major" -lt 3 ] || { [ "$python_major" -eq 3 ] && [ "$python_minor" -lt 12 ]; }; then
    echo "❌ Python 3.12+ required, found $python_version"
    exit 1
fi

echo "✓ Python $python_version"

# Check Node version
echo "Checking Node version..."
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found (optional for extension development)"
else
    node_version=$(node --version)
    echo "✓ Node $node_version"
fi

# Create .env if not exists
echo "Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env from template"
else
    echo "⚠️  .env file already exists. If you encounter configuration errors, consider updating it from .env.example"
fi

# Install OS-level build dependencies if apt is available
if command -v apt-get >/dev/null 2>&1; then
    SUDO=""
    if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
        SUDO=sudo
    fi
    echo "Installing Debian/Ubuntu build dependencies..."
    $SUDO apt-get update -y
    $SUDO apt-get install -y gcc libpq-dev python3-dev python3-venv
    echo "✓ System build dependencies installed"
else
    echo "⚠️ apt-get not found. Please install gcc, libpq-dev, and Python dev headers before running Python dependency install."
fi

# Install backend dependencies
echo "Installing Python dependencies..."
$PYTHON_CMD -m pip cache purge
$PYTHON_CMD -m pip install -e ".[dev]"
echo "✓ Python dependencies installed"

# Install extension dependencies if npm is available
if command -v npm &> /dev/null; then
    echo "Installing extension dependencies..."
    cd extension
    npm install > /dev/null 2>&1
    cd ..
    echo "✓ Extension dependencies installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start Docker services: make docker-up"
echo "  2. Run migrations: make migrations"
echo "  3. Start dev server: make dev"
echo "  4. Visit http://localhost:8000/docs"
echo ""
