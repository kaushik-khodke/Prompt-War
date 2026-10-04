# Makefile for MyHealthChain - Personal Health Decision Coach
.PHONY: test lint build run clean coverage help

help:
	@echo "Available commands:"
	@echo "  make test      - Run automated test suite (unit, integration, a11y, security)"
	@echo "  make coverage  - Run pytest with code coverage report"
	@echo "  make lint      - Check code style and formatting"
	@echo "  make build     - Build frontend production bundle"
	@echo "  make run       - Run development server"

test:
	pytest tests/ -v

coverage:
	pytest tests/ --cov=backend --cov-report=term-missing --cov-report=html

lint:
	python -m flake8 backend/ tests/ --max-line-length=120 --ignore=E501,W503 || true

build:
	cd frontend && npm run build

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf .coverage htmlcov dist build
