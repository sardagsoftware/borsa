# Nirvana TF Bot v2 - Makefile

.PHONY: help install test lint train serve scheduler backtest compose-up compose-down clean

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install:  ## Install dependencies
	pip install -r requirements.txt

test:  ## Run tests
	pytest tests/ -v --cov=src --cov-report=term-missing

lint:  ## Run linters
	black src/ tests/ --check
	ruff check src/ tests/

format:  ## Format code
	black src/ tests/
	ruff check src/ tests/ --fix

train:  ## Train models
	python -m src.training.train --data data/cache --epochs 50 --model-out artifacts/model

serve:  ## Start FastAPI server
	uvicorn src.serving.app:app --host 0.0.0.0 --port 8000 --reload

scheduler:  ## Start 24/7 scheduler
	python -m src.scheduler.loop

backtest:  ## Run backtest
	python -m src.backtest.run --data data/cache --model artifacts/model --output backtest/report.json

compose-up:  ## Start all services with Docker Compose
	docker-compose up -d --build

compose-down:  ## Stop all services
	docker-compose down

compose-logs:  ## View logs
	docker-compose logs -f

clean:  ## Clean artifacts and cache
	rm -rf artifacts/model/* artifacts/checkpoints/* data/cache/* backtest/*.json
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete