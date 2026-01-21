.PHONY: all build clean install frame test capture copy-examples help

# Default target
all:
	make install
	make clean
	make build
	make capture
	make frame
	make copy-examples

# Build TypeScript to JavaScript
build:
	@echo "🔨 Building TypeScript..."
	npm run build

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf screenshots/raw/*.png screenshots/framed/*.png 2>/dev/null || true

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "🌐 Installing Playwright browser..."
	npx playwright install chromium

# Frame existing screenshots in raw/ directory
frame: build
	@echo "🖼️  Framing screenshots..."
	node dist/frame-screenshots.js

# Run test script
test: build
	@echo "🧪 Running tests..."
	node dist/test.js

# Capture screenshot with Playwright and frame it
capture: build
	@echo "📸 Capturing screenshot..."
	node dist/take-screenshot.js

# Copy framed screenshots to examples directory
copy-examples:
	@echo "📋 Copying screenshots to examples..."
	@mkdir -p examples
	@cp screenshots/framed/*.png examples/ 2>/dev/null || echo "⚠️  No screenshots found in screenshots/framed/"
	@echo "✅ Examples copied to examples/"

# Show help
help:
	@echo "Available targets:"
	@echo "  make all      - Build TypeScript (default)"
	@echo "  make build    - Compile TypeScript to JavaScript"
	@echo "  make clean    - Remove build artifacts and screenshots"
	@echo "  make install  - Install dependencies and Playwright browser"
	@echo "  make frame    - Frame existing screenshots in screenshots/raw/"
	@echo "  make test     - Run test script"
	@echo "  make capture       - Capture screenshot with Playwright and frame it"
	@echo "  make           - Run  (same as capture)"
	@echo "  make copy-examples - Copy framed screenshots to examples/ directory"
	@echo "  make help          - Show this help message"